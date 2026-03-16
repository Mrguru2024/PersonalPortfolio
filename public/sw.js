// Empty service worker - no functionality
// This file exists to prevent 404 errors when browsers try to fetch
// a previously registered service worker that no longer exists.
// To unregister any existing service workers, users can clear their browser cache
// or use browser dev tools to unregister service workers.

self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
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

// No fetch handler - all requests pass through to the network
