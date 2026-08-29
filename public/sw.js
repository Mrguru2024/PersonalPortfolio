/**
 * Service Worker for Progressive Web App
 * Caches shell, static assets, and selective project data for offline use
 */

const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;
const ASSET_CACHE = `assets-${CACHE_VERSION}`;

const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/offline',
];

const CACHE_STRATEGIES = {
  shell: 'cache-first',
  api: 'network-first',
  assets: 'cache-first',
  images: 'cache-first',
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Caching shell files');
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('shell-') || name.startsWith('data-') || name.startsWith('assets-');
          })
          .filter((name) => {
            return name !== SHELL_CACHE && name !== DATA_CACHE && name !== ASSET_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)) {
    event.respondWith(handleAssetRequest(request, ASSET_CACHE));
    return;
  }

  if (url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
    event.respondWith(handleAssetRequest(request, ASSET_CACHE));
    return;
  }

  event.respondWith(handleNavigationRequest(request));
});

async function handleApiRequest(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/projects/') || 
      url.pathname.startsWith('/api/client/') ||
      url.pathname.startsWith('/api/portfolio/')) {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const cache = await caches.open(DATA_CACHE);
        cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      console.log('[SW] Network failed, trying cache for:', request.url);
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        return new Response(cachedResponse.body, {
          ...cachedResponse,
          headers: new Headers({
            ...Object.fromEntries(cachedResponse.headers),
            'X-Offline-Response': 'true',
          }),
        });
      }

      return new Response(
        JSON.stringify({
          error: 'Offline and no cached data available',
          offline: true,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return fetch(request);
}

async function handleAssetRequest(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch asset:', request.url);
    return new Response('', { status: 404 });
  }
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, serving from cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const offlinePage = await caches.match('/offline');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_PROJECT_DATA') {
    const { projectId, data } = event.data;
    caches.open(DATA_CACHE).then((cache) => {
      const request = new Request(`/api/projects/${projectId}`);
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put(request, response);
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== SHELL_CACHE) {
            return caches.delete(name);
          }
        })
      );
    });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-project-updates') {
    event.waitUntil(syncProjectUpdates());
  }
});

async function syncProjectUpdates() {
  try {
    const cache = await caches.open(DATA_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/projects/')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          }
        } catch (error) {
          console.log('[SW] Failed to sync:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}
