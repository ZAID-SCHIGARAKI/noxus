import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  root,
  appType: "custom",
  configFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

const core = await vite.ssrLoadModule("/src/studio-core.ts");

after(async () => {
  await vite.close();
});

test("creates an independent app from every template", () => {
  for (const template of core.APP_TEMPLATES) {
    const first = core.createAppFromTemplate(template.id);
    const second = core.createAppFromTemplate(template.id);
    assert.notEqual(first.id, second.id);
    assert.equal(first.name, template.name);
    assert.equal(first.trusted, true);
    assert.notEqual(first.code, template.code);
    assert.equal(typeof first.code.javascript, "string");
  }
});

test("starter apps have stable IDs and runnable web code", () => {
  const apps = core.createStarterApps();
  assert.deepEqual(
    apps.map((app) => app.id),
    ["starter-english-sprint", "starter-quick-quiz", "starter-focus-list"],
  );
  for (const app of apps) {
    assert.ok(app.code.html.length > 100);
    assert.ok(app.code.css.length > 100);
    assert.ok(app.code.javascript.length > 100);
  }
});

test("sandbox document isolates code and escapes closing tags", () => {
  const app = core.createAppFromTemplate("blank");
  app.code.javascript = 'document.body.dataset.test = "ok";</script><p>escape</p>';
  const document = core.buildSandboxDocument(app, "safe-channel", { score: 2 });
  assert.match(document, /Content-Security-Policy/);
  assert.match(document, /connect-src 'none'/);
  assert.match(document, /safe-channel/);
  assert.match(document, /MiniOS/);
  assert.doesNotMatch(document, /<\/script><p>escape<\/p>/);
});

test("backup parser rejects foreign data and distrusts imported code", () => {
  assert.throws(() => core.parseStudioBackup('{"hello":"world"}'), /keine gültige/);
  const app = core.createAppFromTemplate("quiz");
  const backup = {
    format: "zaid-mini-studio",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    apps: [app],
    appData: [{ appId: app.id, values: { best: 80 }, updatedAt: Date.now() }],
    settings: core.DEFAULT_SETTINGS,
  };
  const parsed = core.parseStudioBackup(JSON.stringify(backup));
  assert.equal(parsed.apps[0].trusted, false);
  assert.equal(parsed.appData[0].values.best, 80);
});

test("default mini apps have no network dependencies", () => {
  for (const template of core.APP_TEMPLATES) {
    const source = `${template.code.html}\n${template.code.css}\n${template.code.javascript}`;
    assert.doesNotMatch(source, /https?:\/\//i);
    assert.doesNotThrow(() => new Function(template.code.javascript));
  }
});
