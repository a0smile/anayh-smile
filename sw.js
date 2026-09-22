const CACHE_NAME = 'smile-care-v20';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './icons.js',
  './main.js',
  './admin.js',
  './content.json',
  './manifest.json',
  './hero-blend.jpg',
  './national-day.mp3',
  './service-icons/braces-metal.jpg',
  './service-icons/braces-pink.jpg',
  './service-icons/braces-close.jpg',
  './service-icons/braces-child.jpg',
  './service-icons/braces-kids-treat.jpg',
  './service-icons/aligner-kit.jpg',
  './service-icons/aligner-wear.jpg',
  './service-icons/smile-white.jpg',
  './service-icons/whitening-laser.jpg',
  './service-icons/xray.jpg',
  './service-icons/dental-model.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((u) => cache.add(u).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isStatic = /\.(css|js|jpg|jpeg|png|webp|svg|mp3|woff2?|json)$/i.test(path)
    || path.includes('/service-icons/');

  if (isStatic) {
    // الكاش أولاً للملفات الثابتة = أسرع
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // HTML وباقي الطلبات: الشبكة أولاً
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
