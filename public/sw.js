// PWA service worker: push notifications + offline caching for admin/CRM app use
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => (k.startsWith('static-') || k.startsWith('pages-')) && k !== STATIC_CACHE && k !== PAGES_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Push notifications (admin direct message)
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

// Offline: cache admin/CRM pages and static assets; API stays network-only
function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isAdminPage(url) {
  try {
    const path = new URL(url).pathname;
    return path.startsWith('/admin') || path === '/' || path === '/auth' || path === '/login';
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const path = new URL(url).pathname;
    return path.startsWith('/_next/static/') || path.startsWith('/favicon') || path === '/manifest.json' || path.endsWith('.svg') || path.endsWith('.ico');
  } catch {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request.url)) return;

  // Static assets: cache-first for fast repeat loads
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

  // Admin/app pages: network-first, fallback to cache for offline
  if (isAdminPage(request.url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          if (res.ok && res.type === 'basic') {
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.open(PAGES_CACHE).then((cache) => cache.match(request)).then((cached) => cached || new Response('Offline', { status: 503, statusText: 'Offline' }))
        )
    );
    return;
  }
});
