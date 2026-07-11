/* Teyvat Chrono service worker — offline shell + installability.
   Bump CACHE version to force clients to refresh cached assets. */
const CACHE = 'teyvat-chrono-v18';
const SHELL = ['/', '/index.html', '/styles.css', '/icon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never touch API calls or non-GET — always go to network.
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Navigations: network-first so deploys show up, fall back to cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Same-origin static assets: cache-first, then network (and cache the result).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return resp;
        }).catch(() => cached)
      )
    );
    return;
  }

  // Cross-origin (game asset CDN, fonts): try network, fall back to cache if
  // present. respondWith() must always resolve to a real Response — if the
  // fetch fails AND there's no cached copy, caches.match() resolves to
  // undefined, which throws "Failed to convert value to 'Response'" and can
  // break every cross-origin image on the page at once. Fall back to an
  // explicit error Response so the browser just treats it as a normal failed
  // image load (the page's own onerror fallback handles the rest).
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then((cached) => cached || new Response(null, { status: 502, statusText: 'Bad Gateway' }))
    )
  );
});

// Let the page tell an updated SW to activate immediately.
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
