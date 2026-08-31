const CACHE_PREFIX = "zaid-mini-studio";
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

function scopeUrl(path = "./") {
  return new URL(path, self.registration.scope).href;
}

async function cacheApplicationShell() {
  const cache = await caches.open(CACHE_NAME);
  const rootUrl = scopeUrl();
  const response = await fetch(rootUrl, { cache: "reload", credentials: "same-origin" });
  if (!response.ok) throw new Error(`App-Shell konnte nicht geladen werden: ${response.status}`);

  await cache.put(rootUrl, response.clone());
  const html = await response.text();
  const assetCandidates = new Set([
    scopeUrl("./manifest.webmanifest"),
    scopeUrl("./icons/icon-192.png"),
    scopeUrl("./icons/icon-512.png"),
    scopeUrl("./icons/apple-touch-icon.png"),
  ]);

  const attributePattern = /(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const url = new URL(match[1], rootUrl);
    if (url.origin === self.location.origin && url.href.startsWith(self.registration.scope)) {
      assetCandidates.add(url.href);
    }
  }

  await Promise.allSettled(
    [...assetCandidates].map(async (url) => {
      const asset = await fetch(url, { cache: "reload", credentials: "same-origin" });
      if (asset.ok) await cache.put(url, asset);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheApplicationShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const network = await fetch(request);
    if (network.ok) {
      await cache.put(scopeUrl(), network.clone());
    }
    return network;
  } catch {
    return (await cache.match(scopeUrl())) || Response.error();
  }
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const network = await fetch(request);
    if (network.ok) await cache.put(request, network.clone());
    return network;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  event.respondWith(assetResponse(request));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

