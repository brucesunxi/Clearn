const CACHE = 'panda-chinese-v1';
const STATIC_CACHE = 'panda-static-v1';

const STATIC_EXTENSIONS = [
  '.js', '.css', '.json', '.png', '.jpg', '.jpeg',
  '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf',
];

const API_PATTERNS = [/^\/api\//];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isApiRequest(url) {
  return API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isNavigation(url) {
  return url.pathname === '/' || /^\/[a-z-]+(\/[a-z0-9-]+)?$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (isApiRequest(url)) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstThenNetwork(event.request));
    return;
  }

  if (isNavigation(url)) {
    event.respondWith(networkFirstThenCache(event.request, { fallback: '/' }));
    return;
  }

  event.respondWith(networkFirstThenCache(event.request));
});

async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

async function networkFirstThenCache(request, { fallback } = {}) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallback) return caches.match(fallback);
    return new Response('Offline', { status: 503 });
  }
}
