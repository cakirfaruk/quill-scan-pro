import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './use-network-status';
import { offlineStorage } from '@/utils/offlineStorage';
import { useToast } from './use-toast';

interface CacheOptions {
  storeName: string;
  syncInterval?: number; // ms
  maxAge?: number; // ms
}

export const useOfflineCache = <T extends { id: string }>(options: CacheOptions) => {
  const { storeName, syncInterval = 60000, maxAge = 7 * 24 * 60 * 60 * 1000 } = options;
  const isOnline = useNetworkStatus();
  const { toast } = useToast();
  const [cachedData, setCachedData] = useState<T[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);

  // Load cached data on mount
  useEffect(() => {
    loadFromCache();
  }, [storeName]);

  // Periodic cleanup of old data
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupOldData();
    }, syncInterval);

    return () => clearInterval(cleanupInterval);
  }, [storeName, maxAge]);

  const loadFromCache = async () => {
    try {
      setIsLoadingCache(true);
      const data = await offlineStorage.getAll(storeName);
      setCachedData(data as T[]);
      const count = await offlineStorage.count(storeName);
      setCacheSize(count);
    } catch (error) {
      console.error(`Error loading from cache (${storeName}):`, error);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const saveToCache = useCallback(async (items: T | T[]) => {
    try {
      const itemsArray = Array.isArray(items) ? items : [items];
      
      // Check size limit before saving
      const currentSize = await offlineStorage.estimateSize();
      const settings = JSON.parse(localStorage.getItem('cache-settings') || '{}');
      const maxSize = (settings.maxSize || 50) * 1024 * 1024; // Convert MB to bytes
      
      if (currentSize > maxSize * 0.9) { // 90% threshold
        toast({
          title: "Önbellek Neredeyse Dolu",
          description: "Eski veriler otomatik olarak temizlenecek.",
          duration: 3000,
        });
        await offlineStorage.cleanup();
      }
      
      if (itemsArray.length === 1) {
        await offlineStorage.save(storeName, itemsArray[0]);
      } else {
        await offlineStorage.saveMany(storeName, itemsArray);
      }
      
      // Enforce size limit after saving
      await offlineStorage.enforceSizeLimit();
      
      await loadFromCache();
      
      // Show toast only if offline and caching important data
      if (!isOnline && (storeName === 'posts' || storeName === 'messages')) {
        toast({
          title: "Çevrimdışı Mod",
          description: `${itemsArray.length} öğe önbelleğe kaydedildi`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`Error saving to cache (${storeName}):`, error);
    }
  }, [storeName, isOnline]);

  const getFromCache = useCallback(async (id: string): Promise<T | null> => {
    try {
      const item = await offlineStorage.get(storeName, id);
      return item as T | null;
    } catch (error) {
      console.error(`Error getting from cache (${storeName}):`, error);
      return null;
    }
  }, [storeName]);

  const removeFromCache = useCallback(async (id: string) => {
    try {
      await offlineStorage.delete(storeName, id);
      await loadFromCache();
    } catch (error) {
      console.error(`Error removing from cache (${storeName}):`, error);
    }
  }, [storeName]);

  const clearCache = useCallback(async () => {
    try {
      await offlineStorage.clear(storeName);
      setCachedData([]);
      setCacheSize(0);
      toast({
        title: "Önbellek Temizlendi",
        description: "Tüm çevrimdışı veriler silindi",
      });
    } catch (error) {
      console.error(`Error clearing cache (${storeName}):`, error);
    }
  }, [storeName]);

  const cleanupOldData = async () => {
    try {
      const cutoffTime = Date.now() - maxAge;
      const oldItems = await offlineStorage.getOlderThan(storeName, cutoffTime);
      
      if (oldItems.length > 0) {
        for (const item of oldItems) {
          await offlineStorage.delete(storeName, item.id);
        }
        console.log(`Cleaned up ${oldItems.length} old items from ${storeName}`);
        await loadFromCache();
      }
    } catch (error) {
      console.error(`Error cleaning up old data (${storeName}):`, error);
    }
  };

  const syncWithOnlineData = useCallback(async (onlineData: T[]) => {
    try {
      // Update cache with latest online data
      await offlineStorage.clear(storeName);
      await offlineStorage.saveMany(storeName, onlineData);
      await loadFromCache();
    } catch (error) {
      console.error(`Error syncing with online data (${storeName}):`, error);
    }
  }, [storeName]);

  const getCacheInfo = useCallback(() => {
    return {
      size: cacheSize,
      itemCount: cachedData.length,
      storeName,
      isOnline,
    };
  }, [cacheSize, cachedData.length, storeName, isOnline]);

  return {
    cachedData,
    isLoadingCache,
    cacheSize,
    saveToCache,
    getFromCache,
    removeFromCache,
    clearCache,
    loadFromCache,
    syncWithOnlineData,
    getCacheInfo,
  };
};
