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

// No fetch handler - all requests pass through to the network
// This effectively disables the service worker while preventing 404 errors
