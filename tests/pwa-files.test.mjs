import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("manifest is installable and all icons exist", async () => {
  const manifest = JSON.parse(await readFile(`${root}/public/manifest.webmanifest`, "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  await Promise.all(manifest.icons.map((icon) => access(`${root}/public/${icon.src.replace(/^\.\//, "")}`)));
  await access(`${root}/public/icons/apple-touch-icon.png`);
});

test("service worker compiles and contains offline navigation fallback", async () => {
  const source = await readFile(`${root}/public/sw.js`, "utf8");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /cacheApplicationShell/);
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /cache\.match\(scopeUrl\(\)\)/);
});

test("GitHub Pages workflow builds the production directory", async () => {
  const workflow = await readFile(`${root}/.github/workflows/deploy.yml`, "utf8");
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path: \.\/dist/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

