const CACHE_NAME = 'smile-care-v15';
const ASSETS = [
  './',
  './index.html',
  './catalog.html',
  './style.css',
  './icons.js',
  './main.js',
  './catalog.js',
  './admin.js',
  './content.json',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './hero-blend.jpg',
  './flag-sa.png',
  './emblem-sa.png',
  './national-day.mp3'
,
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  // ملفات الموقع: الشبكة أولاً حتى تظهر التحديثات فوراً، والكاش احتياط عند انقطاع الاتصال
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
