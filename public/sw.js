const CACHE_NAME = 'kdru-wms-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Check if the request is for an API
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If online, clone the response and save it or just return it
          // For a simple app, we can just return it. 
          // More advanced: save to IndexedDB here.
          return response;
        })
        .catch(() => {
          // If offline, check if we have a cached response (usually not for POST/PUT)
          // For GET requests, we might want to return a cached version
          return caches.match(event.request);
        })
    );
    return;
  }

  // For non-API requests (assets)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
