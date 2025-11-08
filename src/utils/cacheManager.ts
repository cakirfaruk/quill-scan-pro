/**
 * Cache Management Utilities
 * Handles browser cache, Service Worker updates, and version control
 */

/**
 * Clear outdated caches from the browser
 * Removes old cache versions to ensure fresh content
 */
export const clearOldCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    console.log('Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.log('Found caches:', cacheNames);

    // Delete old caches (containing 'old', 'v1', 'v2', etc.)
    const cachesToDelete = cacheNames.filter(cacheName => {
      return (
        cacheName.includes('old') ||
        cacheName.includes('v1') ||
        cacheName.includes('v2') ||
        cacheName.includes('v3') ||
        // Delete caches older than current workbox version
        cacheName.match(/workbox-precache-v\d+-/) ||
        cacheName.match(/-v\d+$/)
      );
    });

    if (cachesToDelete.length > 0) {
      console.log('Deleting old caches:', cachesToDelete);
      await Promise.all(
        cachesToDelete.map(cacheName => caches.delete(cacheName))
      );
      console.log(`Deleted ${cachesToDelete.length} old cache(s)`);
    } else {
      console.log('No old caches to delete');
    }
  } catch (error) {
    console.error('Error clearing old caches:', error);
  }
};

/**
 * Force Service Worker to update immediately
 * Skips waiting and claims all clients
 */
export const forceServiceWorkerUpdate = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('No Service Worker registered');
      return false;
    }

    // Force update check
    await registration.update();
    console.log('Service Worker update check completed');

    // If there's a waiting worker, skip waiting and activate
    if (registration.waiting) {
      console.log('Activating waiting Service Worker');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to become active
      await new Promise<void>((resolve) => {
        const checkState = () => {
          if (registration.active) {
            resolve();
          }
        };
        
        if (registration.waiting) {
          registration.waiting.addEventListener('statechange', checkState);
        } else {
          resolve();
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error forcing Service Worker update:', error);
    return false;
  }
};

/**
 * Complete cache refresh and reload
 * Clears all caches, updates Service Worker, and reloads the page
 */
export const performFullCacheRefresh = async (): Promise<void> => {
  try {
    console.log('Starting full cache refresh...');
    
    // Step 1: Clear all caches
    await clearOldCaches();
    
    // Step 2: Clear all remaining caches for complete refresh
    if ('caches' in window) {
      const allCaches = await caches.keys();
      await Promise.all(allCaches.map(cache => caches.delete(cache)));
      console.log('All caches cleared');
    }
    
    // Step 3: Unregister and re-register Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('Service Workers unregistered');
    }
    
    // Step 4: Clear localStorage items related to cache
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('version'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Full cache refresh completed');
  } catch (error) {
    console.error('Error performing full cache refresh:', error);
    throw error;
  }
};

/**
 * Check if app needs update based on version
 */
export const checkAppVersion = (): { needsUpdate: boolean; currentVersion: string } => {
  const CURRENT_VERSION = '2.0.0'; // Update this with each release
  const storedVersion = localStorage.getItem('app-version');
  
  if (!storedVersion || storedVersion !== CURRENT_VERSION) {
    localStorage.setItem('app-version', CURRENT_VERSION);
    return {
      needsUpdate: !!storedVersion && storedVersion !== CURRENT_VERSION,
      currentVersion: CURRENT_VERSION
    };
  }
  
  return {
    needsUpdate: false,
    currentVersion: CURRENT_VERSION
  };
};
