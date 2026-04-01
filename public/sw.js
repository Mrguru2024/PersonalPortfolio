// PWA service worker: push notifications + offline caching for installed app use
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;

const OFFLINE_PATH = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.add(new Request(OFFLINE_PATH, { cache: 'reload' }));
      } catch (_) {
        /* offline page may fail in dev; continue */
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.disable();
        }
      } catch (_) {
        /* ignore */
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => (k.startsWith('static-') || k.startsWith('pages-')) && k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = { title: 'Notification', body: '' };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      tag: data.tag || 'default',
      requireInteraction: !!data.requireInteraction,
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

/**
 * HTML navigations we cache for offline replay (network-first).
 * Includes marketing start URL + common app hubs so “Add to Home Screen” stays useful offline.
 */
function usesOfflineDocumentCache(url) {
  try {
    const path = new URL(url).pathname;
    if (path.startsWith('/admin')) return true;
    if (path === '/auth' || path === '/login' || path.startsWith('/auth/')) return true;
    if (path === '/') return true;
    if (path.startsWith('/dashboard')) return true;
    if (path.startsWith('/portal')) return true;
    if (path.startsWith('/blog')) return true;
    if (path === '/free-growth-tools' || path.startsWith('/free-growth-tools/')) return true;
    if (path === '/contact' || path.startsWith('/contact/')) return true;
    if (path === '/strategy-call' || path.startsWith('/strategy-call/')) return true;
    return false;
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const path = new URL(url).pathname;
    return (
      path.startsWith('/_next/static/') ||
      path.startsWith('/favicon') ||
      path === '/manifest.json' ||
      path === OFFLINE_PATH ||
      path.endsWith('.svg') ||
      path.endsWith('.ico')
    );
  } catch {
    return false;
  }
}

async function offlineFallbackResponse() {
  const cached = await caches.match(OFFLINE_PATH);
  if (cached) return cached;
  return new Response(
    '<!DOCTYPE html><html><body><p>Offline</p><script>location.reload()</script></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request.url)) return;

  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => cached || fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  if (usesOfflineDocumentCache(request.url)) {
    event.respondWith(
      (async () => {
        let res;
        if (request.mode === 'navigate') {
          try {
            const preloaded = await event.preloadResponse;
            if (preloaded && preloaded.ok) {
              res = preloaded;
            }
          } catch (_) {
            /* ignore */
          }
        }
        try {
          if (!res) {
            res = await fetch(request);
          }
          const clone = res.clone();
          if (res.ok && res.type === 'basic') {
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        } catch (_) {
          const cached = await caches.open(PAGES_CACHE).then((cache) => cache.match(request));
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return offlineFallbackResponse();
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }
});
