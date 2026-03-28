const CACHE_NAME = 'fruechte-v1';

// Relative Pfade – funktioniert automatisch auf GitHub Pages
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fonts separat – dürfen fehlschlagen
      cache.add('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap').catch(()=>{});
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Gemini API – nie cachen, immer live
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('generateContent')) return;

  // Google Fonts – Cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Alles andere – Cache-first, dann Netzwerk
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      });
    })
  );
});
