/// <reference lib="webworker" />
// WaveFlow Service Worker — Offline shell + asset caching
// CRITICAL: Never cache streaming audio (/api/stream/) — those are live CDN proxied byte-ranges.

const CACHE_NAME = 'waveflow-shell-v1';

// App shell assets to pre-cache for offline startup
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: Pre-cache the app shell so UI loads offline
self.addEventListener('install', (event) => {
  (self as any).skipWaiting();
  (event as any).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  (event as any).waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => (self as any).clients.claim())
  );
});

// Fetch strategy:
//  - /api/stream/* → NETWORK ONLY (never cache live audio proxy streams)
//  - /api/*        → Network-first, fall back to cache
//  - Everything else (static assets, pages) → Cache-first, fall back to network
self.addEventListener('fetch', (event) => {
  const request = (event as any).request as Request;
  const url = new URL(request.url);

  // 1. Never intercept streaming audio — let it go straight to network
  if (url.pathname.startsWith('/api/stream')) {
    return; // Do not call respondWith, let browser handle natively
  }

  // 2. API calls — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    (event as any).respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response('{"error":"offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })))
    );
    return;
  }

  // 3. Static assets and pages — cache first, network fallback
  (event as any).respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful navigations and static resources
        if (response.status === 200 && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // For navigation requests, serve the cached shell
      if (request.mode === 'navigate') {
        return caches.match('/') as Promise<Response>;
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

export {};
