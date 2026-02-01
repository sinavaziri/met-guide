/**
 * Met Guide Service Worker
 * 
 * Provides offline caching for previously viewed artworks,
 * audio guides, and static assets.
 */

const CACHE_NAME = 'met-guide-v1';
const STATIC_CACHE = 'met-guide-static-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/tours',
  '/scan',
  '/search',
];

// Cache strategies
const CACHE_FIRST_PATTERNS = [
  /^https:\/\/images\.metmuseum\.org/,
  /\/api\/tts\?/,
];

const NETWORK_FIRST_PATTERNS = [
  /\/api\/object\//,
  /\/api\/narrate\?/,
  /\/api\/tours/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if some static assets aren't available
        console.warn('Some static assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // Cache-first for images and audio
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(request.url))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for API data
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(request.url))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale-while-revalidate for everything else (pages, JS, CSS)
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}
