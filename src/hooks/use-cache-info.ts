import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

interface CacheInfo {
  totalSize: number;
  hybridCacheSize: number;
  hybridCacheCount: number;
  offlineStorageSize: number;
  offlineStorageCount: number;
  serviceWorkerCaches: Array<{
    name: string;
    size: number;
    count: number;
  }>;
  storageQuota: {
    usage: number;
    quota: number;
    percentage: number;
  };
}

export const useCacheInfo = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateSize = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Storage Quota API
      const storageEstimate = await navigator.storage.estimate();
      const usage = storageEstimate.usage || 0;
      const quota = storageEstimate.quota || 0;
      
      // Hybrid Cache (IndexedDB)
      let hybridCacheSize = 0;
      let hybridCacheCount = 0;
      try {
        const db = await openDB('hybrid-cache-db', 1);
        const tx = db.transaction('api-cache', 'readonly');
        const store = tx.objectStore('api-cache');
        const allKeys = await store.getAllKeys();
        hybridCacheCount = allKeys.length;
        
        // Approximate size calculation
        const allValues = await store.getAll();
        hybridCacheSize = JSON.stringify(allValues).length;
        
        await tx.done;
        db.close();
      } catch (err) {
        console.warn('Hybrid cache not accessible:', err);
      }
      
      // Offline Storage (IndexedDB)
      let offlineStorageSize = 0;
      let offlineStorageCount = 0;
      try {
        const db = await openDB('offline-storage-db', 1);
        const storeNames = Array.from(db.objectStoreNames);
        
        for (const storeName of storeNames) {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const allKeys = await store.getAllKeys();
          offlineStorageCount += allKeys.length;
          
          const allValues = await store.getAll();
          offlineStorageSize += JSON.stringify(allValues).length;
          
          await tx.done;
        }
        
        db.close();
      } catch (err) {
        console.warn('Offline storage not accessible:', err);
      }
      
      // Service Worker Caches
      const serviceWorkerCaches: Array<{ name: string; size: number; count: number }> = [];
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          let cacheSize = 0;
          
          // Approximate size by fetching a few responses
          const sampleSize = Math.min(10, requests.length);
          for (let i = 0; i < sampleSize; i++) {
            const response = await cache.match(requests[i]);
            if (response) {
              const blob = await response.blob();
              cacheSize += blob.size * (requests.length / sampleSize); // Extrapolate
            }
          }
          
          serviceWorkerCaches.push({
            name: cacheName,
            size: Math.round(cacheSize),
            count: requests.length,
          });
        }
      }
      
      const totalSize = usage;
      
      setCacheInfo({
        totalSize,
        hybridCacheSize,
        hybridCacheCount,
        offlineStorageSize,
        offlineStorageCount,
        serviceWorkerCaches,
        storageQuota: {
          usage,
          quota,
          percentage: quota > 0 ? (usage / quota) * 100 : 0,
        },
      });
    } catch (error) {
      console.error('Error calculating cache size:', error);
      setCacheInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateSize();
  }, [calculateSize]);

  const clearHybridCache = useCallback(async () => {
    try {
      const db = await openDB('hybrid-cache-db', 1);
      const tx = db.transaction('api-cache', 'readwrite');
      await tx.objectStore('api-cache').clear();
      await tx.done;
      db.close();
      await calculateSize(); // Refresh
      return true;
    } catch (error) {
      console.error('Error clearing hybrid cache:', error);
      return false;
    }
  }, [calculateSize]);

  const clearOfflineStorage = useCallback(async () => {
    try {
      const db = await openDB('offline-storage-db', 1);
      const storeNames = Array.from(db.objectStoreNames);
      
      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, 'readwrite');
        await tx.objectStore(storeName).clear();
        await tx.done;
      }
      
      db.close();
      await calculateSize(); // Refresh
      return true;
    } catch (error) {
      console.error('Error clearing offline storage:', error);
      return false;
    }
  }, [calculateSize]);

  const clearServiceWorkerCache = useCallback(async (cacheName?: string) => {
    try {
      if (cacheName) {
        await caches.delete(cacheName);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      await calculateSize(); // Refresh
      return true;
    } catch (error) {
      console.error('Error clearing service worker cache:', error);
      return false;
    }
  }, [calculateSize]);

  const clearAllCaches = useCallback(async () => {
    const results = await Promise.all([
      clearHybridCache(),
      clearOfflineStorage(),
      clearServiceWorkerCache(),
    ]);
    return results.every(result => result);
  }, [clearHybridCache, clearOfflineStorage, clearServiceWorkerCache]);

  return {
    cacheInfo,
    isLoading,
    refresh: calculateSize,
    clearHybridCache,
    clearOfflineStorage,
    clearServiceWorkerCache,
    clearAllCaches,
  };
};
