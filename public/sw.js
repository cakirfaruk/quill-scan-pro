// Service Worker for offline caching and push notifications
const CACHE_NAME = 'kam-v1';
const urlsToCache = [
  '/',
  '/feed',
  '/tarot',
  '/messages',
  '/index.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/rest/v1/') || event.request.url.includes('/auth/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Görüntüle',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('KAM', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    console.log('[SW] Starting offline queue sync');
    
    // Get the offline queue from IndexedDB
    const db = await openOfflineDB();
    const queue = await getQueueFromDB(db);
    
    if (queue.length === 0) {
      console.log('[SW] No items in queue to sync');
      return;
    }
    
    console.log(`[SW] Syncing ${queue.length} queued items`);
    
    // Try to sync each item
    for (const item of queue) {
      try {
        await syncItem(item);
        await removeFromQueue(db, item.id);
        console.log('[SW] Successfully synced item:', item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    console.log('[SW] Offline queue sync complete');
  } catch (error) {
    console.error('[SW] Error in syncOfflineQueue:', error);
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-storage', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getQueueFromDB(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-queue'], 'readonly');
    const store = transaction.objectStore('offline-queue');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-queue'], 'readwrite');
    const store = transaction.objectStore('offline-queue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function syncItem(item) {
  // This would need to make requests to your Supabase backend
  // For now, we'll just simulate success
  console.log('[SW] Syncing item:', item);
  // The actual sync is handled by the React app when it comes online
  // This is just a fallback for background sync
  return Promise.resolve();
}
