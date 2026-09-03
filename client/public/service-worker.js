/* =====================================================================
   AI Disaster App service worker.

   Goal: the app shell, the bundled safety guidance and the emergency
   numbers must open with no network. The AI assistant is never cached and
   never faked - /api requests always go to the network so the app can
   honestly report that the assistant is unavailable.
   ===================================================================== */

const VERSION = 'v1';
const SHELL_CACHE = `ai-disaster-shell-${VERSION}`;
const ASSET_CACHE = `ai-disaster-assets-${VERSION}`;

/* Everything needed to render the app offline apart from hashed bundles,
   which are picked up on first visit by the runtime handler below. */
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one missing file cannot fail the whole install.
      await Promise.all(
        SHELL_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('ai-disaster-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/** Lets the page activate a waiting worker without a manual reload. */
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

/* ------------------------------------------------------------ Strategies */

async function networkFirstDocument(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put('/index.html', response.clone());
    return response;
  } catch {
    // Any in-app route falls back to the cached shell; the router takes over.
    return (
      (await cache.match(request)) ||
      (await cache.match('/index.html')) ||
      Response.error()
    );
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Hashed bundles never change under the same URL, so no revalidation.
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);

  const update = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await update) || Response.error();
}

/* ---------------------------------------------------------------- Routing */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // The assistant is online-only. Never serve a stale or invented answer.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/og-image.png'
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
