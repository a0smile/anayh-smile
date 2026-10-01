const CACHE_NAME = 'smile-care-v36-green';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './icons.js',
  './main.js',
  './admin.js',
  './content.json',
  './manifest.json',
  './catalog.html',
  './catalog.js',
  './hero-blend.jpg',
  './service-card-bg.jpg',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
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

const STATIC_PATTERN = /\.(css|js|jpg|jpeg|png|webp|svg|woff2?|json)$/i;

async function cacheAssets() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled(
    ASSETS.map(async (url) => {
      try {
        await cache.add(url);
      } catch {
        // ملف غير متاح أثناء التثبيت لا يمنع تثبيت Service Worker بالكامل.
      }
    })
  );
}

async function updateCachedResponse(request) {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return null;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAssets());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  const isStatic =
    STATIC_PATTERN.test(path) ||
    path.includes('/service-icons/');

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        const fresh = await updateCachedResponse(event.request);

        return cached || fresh || Response.error();
      })
    );

    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);

        if (cached) return cached;

        return (
          (await caches.match('./index.html')) ||
          Response.error()
        );
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
