const CACHE_NAME = "nne-pwa-v2";
const scope = new URL(self.registration.scope);
const scopedPath = (path) => new URL(path, scope).pathname;
const APP_SHELL = [scopedPath("./"), scopedPath("manifest.webmanifest"), scopedPath("icons/nne-icon-v2-192.png"), scopedPath("icons/nne-icon-v2-512.png")];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(scopedPath("./"), response.clone()));
          return response;
        })
        .catch(() => caches.match(scopedPath("./")))
    );
    return;
  }

  if (/\.(?:js|css|png|jpe?g|webp|svg|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      }))
    );
  }
});
