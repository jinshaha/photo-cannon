const C = 'fp-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C)
      .then(c => Promise.allSettled([c.add('./'), c.add('./index.html')]))
      .catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  if (req.url.includes('/data/requests.json')) {
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); }
          return r;
        })
        .catch(() => caches.match(req).then(h => h || Response.error()))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); }
        return r;
      });
    })
  );
});
