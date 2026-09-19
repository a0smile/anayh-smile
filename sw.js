const CACHE_NAME = 'smile-care-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './admin.js',
  './content.json',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './assets/national/hero-blend.jpg',
  './assets/national/clinic-exterior.jpg',
  './assets/national/clinic-interior.jpg',
  './assets/national/flag-sa.png',
  './assets/national/emblem-sa.png',
  './assets/national/tower-kingdom.jpg',
  './assets/national/tower-faisaliah.jpg',
  './assets/national/riyadh-skyline.jpg'
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
