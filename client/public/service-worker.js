/* =====================================================================
   AI Disaster App service worker.

   Goal: the app shell, the bundled safety guidance and the emergency
   numbers must open with no network. The AI assistant is never cached and
   never faked - /api requests always go to the network so the app can
   honestly report that the assistant is unavailable.

   Base Path: Dynamically derived from self.registration.scope so the
   service worker works universally whether deployed at root (/) on Vercel
   or under a subpath (/anam/) on an experimental server.
   ===================================================================== */

const VERSION = 'v2';
const SHELL_CACHE = `ai-disaster-shell-${VERSION}`;
const ASSET_CACHE = `ai-disaster-assets-${VERSION}`;

// Dynamically determine the base path from registration scope
const getBasePath = () => {
  try {
    const scope = self.registration ? self.registration.scope : self.location.origin + '/';
    const pathname = new URL(scope).pathname;
    return pathname.endsWith('/') ? pathname : pathname + '/';
  } catch {
    return '/';
  }
};

const BASE = getBasePath();

const resolvePath = (p) => {
  const clean = p.startsWith('/') ? p.slice(1) : p;
  return `${BASE}${clean}`;
};

/* Everything needed to render the app offline apart from hashed bundles,
   which are picked up on first visit by the runtime handler below. */
const SHELL_ASSETS = [
  BASE,
  resolvePath('index.html'),
  resolvePath('manifest.webmanifest'),
  resolvePath('icons/icon.svg'),
  resolvePath('icons/icon-192.png'),
  resolvePath('icons/icon-512.png'),
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
  const indexKey = resolvePath('index.html');

  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(indexKey, response.clone());
    return response;
  } catch {
    // Any in-app route falls back to the cached shell; the router takes over.
    return (
      (await cache.match(request)) ||
      (await cache.match(indexKey)) ||
      (await cache.match(BASE)) ||
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

  const path = url.pathname;
  const relativePath = path.startsWith(BASE) ? '/' + path.slice(BASE.length) : path;

  // The assistant is online-only. Never serve a stale or invented answer.
  if (relativePath.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  if (relativePath.startsWith('/assets/')) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (
    relativePath.startsWith('/icons/') ||
    relativePath === '/manifest.webmanifest' ||
    relativePath === '/og-image.png'
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
