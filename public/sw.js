// Service Worker for push notifications and offline support
// v2 — force immediate activation to bust stale chunk caches after deploys
const SW_VERSION = 'v2';

self.addEventListener('install', (event) => {
  // Skip waiting immediately so new SW takes over without waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete ALL old caches so stale chunks from previous deploys are removed
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== 'lovable-cache-' + SW_VERSION)
          .map(name => caches.delete(name))
      );
      // Claim all open tabs immediately
      await clients.claim();
    })()
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'notification',
    data: {
      url: data.link || data.url || '/'
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Cache strategies for offline support
const CACHE_NAME = 'lovable-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});