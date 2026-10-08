const CACHE = "pes-rh-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add("/offline")),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_CACHES") return;
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/offline")) ?? offlineFallback()),
    );
    return;
  }

  if (!isStaticAsset(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) ?? offlineFallback()),
  );
});

function offlineFallback() {
  return new Response("Connexion requise pour accéder à vos données RH", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function isStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/") || pathname.startsWith("/pwa/") || pathname === "/offline";
}
