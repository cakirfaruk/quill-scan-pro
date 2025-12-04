// Custom Service Worker for Stellara PWA
// Handles push notifications and notification clicks

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let data = {
    title: 'Stellara',
    body: 'Yeni bir bildirim var!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/notifications'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        url: payload.url || payload.data?.url || data.url,
        image: payload.image,
        tag: payload.tag || 'stellara-notification',
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || []
      };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    data: { url: data.url },
    actions: data.actions,
    vibrate: [100, 50, 100],
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Handle action button clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    // You can handle different actions here
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed');
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncMessages() {
  console.log('Syncing offline messages...');
  // Implementation for syncing offline messages
}

async function syncPosts() {
  console.log('Syncing offline posts...');
  // Implementation for syncing offline posts
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  console.log('Checking for new notifications...');
  // Implementation for checking notifications
}

// Handle share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target POST requests
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  const url = formData.get('url') || '';
  const files = formData.getAll('media');

  // Store shared data for the app to pick up
  const sharedData = { title, text, url, files: files.length };
  
  // Redirect to create post page with shared data
  const redirectUrl = `/feed?share=true&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  
  return Response.redirect(redirectUrl, 303);
}

console.log('✨ Stellara Service Worker loaded');
