/* eslint-disable */
/**
 * GreyAuction PWA service worker (L1 base).
 *
 * Strategies:
 *  - Navigations:   network-first, falling back to the precached /offline page.
 *  - Static assets: cache-first (/_next/static, /icons, images, fonts) with runtime caching.
 *  - API / auth:    never intercepted (live data only — bids must never be stale).
 *  - Push:          push + notificationclick handlers ready for the VAPID phase.
 *
 * Registered only in production builds (see shared/components/common/pwa/pwa-provider.tsx).
 */
const VERSION = 'greyauction-v1';
const STATIC_CACHE = VERSION + '-static';
const RUNTIME_CACHE = VERSION + '-runtime';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /^\/_next\/image\?/,
  /^\/icons\//,
  /\.(?:png|jpe?g|webp|avif|gif|svg|woff2?|ico)$/i,
];

function isStaticAsset(url) {
  return STATIC_PATTERNS.some(function (re) {
    return re.test(url.pathname + url.search);
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    (async function () {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.all(
        PRECACHE_URLS.map(function (u) {
          return cache.add(new Request(u, { cache: 'reload' })).catch(function () {});
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(function (k) { return !k.startsWith(VERSION); }).map(function (k) { return caches.delete(k); }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Live-data routes are never cached: bidding, auth, API.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname === '/auth'
  ) {
    return;
  }

  // Page navigations: network-first with offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async function () {
        try {
          return await fetch(req);
        } catch (err) {
          const cached = await caches.match(OFFLINE_URL);
          return cached || new Response('You are offline.', { status: 503 });
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first with runtime fill.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async function () {
        const hit = await caches.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.ok && res.type === 'basic') {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          return new Response('', { status: 503 });
        }
      })(),
    );
  }
});

/* Push seam (active once VAPID keys are configured — L1 follow-up). */

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'GreyAuction', body: event.data ? event.data.text() : '' };
  }
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title || 'GreyAuction', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
