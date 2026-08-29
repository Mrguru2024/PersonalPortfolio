/**
 * PWA registration hook
 * Registers service worker and manages offline capabilities
 */

'use client';

import { useEffect, useState } from 'react';

export function usePWA() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✓ Service Worker registered');
          setRegistration(reg);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedsUpdate(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Background sync is experimental - only use if supported
      if (registration && 'sync' in registration) {
        (registration as any).sync.register('sync-project-updates').catch(() => {});
      }
    };

    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const cacheProjectData = (projectId: string, data: any) => {
    if (registration) {
      registration.active?.postMessage({
        type: 'CACHE_PROJECT_DATA',
        projectId,
        data,
      });
    }
  };

  const clearCache = () => {
    if (registration) {
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
    }
  };

  return {
    isOnline,
    needsUpdate,
    updateServiceWorker,
    cacheProjectData,
    clearCache,
  };
}
