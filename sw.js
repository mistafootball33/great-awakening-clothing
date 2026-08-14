/* Great Awakening Clothing — service worker.
   Pages: network-first (fresh content, cached fallback offline).
   Static assets: stale-while-revalidate. API: network-first with cached fallback.
   Video is left to the browser (range requests don't cache cleanly). */
const CACHE = "ga-store-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["index.html", "shop.html", "product.html", "manifest.webmanifest"]).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.endsWith(".mp4")) return; // range requests — let the network handle video

  // API + page navigations: network first, fall back to cache when offline.
  const networkFirst = url.hostname.endsWith("hostinger.com") || req.mode === "navigate";

  e.respondWith(
    networkFirst
      ? fetch(req)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
            return res.clone();
          })
          .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }))
      : caches.match(req).then((cached) => {
          const fresh = fetch(req)
            .then((res) => {
              if (res.ok && url.origin === location.origin)
                caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
              return res.clone();
            })
            .catch(() => cached);
          return cached || fresh;
        })
  );
});
