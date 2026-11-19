const CACHE_NAME = "dento-brand-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy)));
        }
        return response;
      }).catch(async () => (await caches.match("./index.html")) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, copy)));
      }
      return response;
    }))
  );
});