import { useQuery, useQueryClient } from '@tanstack/react-query';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheDB extends DBSchema {
  'api-cache': {
    key: string;
    value: {
      data: any;
      timestamp: number;
      queryKey: string;
    };
  };
}

const CACHE_VERSION = 1;
const CACHE_DB_NAME = 'hybrid-cache-db';
const CACHE_STORE = 'api-cache';
const MAX_AGE = 60 * 60 * 1000; // 1 saat

let db: IDBPDatabase<CacheDB> | null = null;

async function getDB() {
  if (db) return db;
  
  db = await openDB<CacheDB>(CACHE_DB_NAME, CACHE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    },
  });
  
  return db;
}

/**
 * Hybrid cache hook - Cache'ten anında serve et, arka planda güncelle
 * StaleWhileRevalidate pattern için React Query + IndexedDB
 */
export function useHybridCache<TData>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const queryClient = useQueryClient();
  const cacheKey = JSON.stringify(queryKey);

  return useQuery({
    queryKey,
    queryFn: async () => {
      // 1. Önce IndexedDB'den cache'i kontrol et
      try {
        const db = await getDB();
        const cached = await db.get(CACHE_STORE, cacheKey);
        
        if (cached && Date.now() - cached.timestamp < MAX_AGE) {
          // Cache'ten veriyi döndür (anında!)
          console.log('✅ Cache HIT:', cacheKey);
          
          // Arka planda güncelleme başlat (promise döndürme)
          queryFn().then(async (freshData) => {
            // Yeni veriyi cache'e kaydet
            await db.put(CACHE_STORE, {
              data: freshData,
              timestamp: Date.now(),
              queryKey: cacheKey,
            }, cacheKey);
            
            // React Query cache'ini güncelle
            queryClient.setQueryData(queryKey, freshData);
            console.log('🔄 Background update:', cacheKey);
          }).catch(err => {
            console.warn('Background update failed:', err);
          });
          
          return cached.data;
        }
      } catch (err) {
        console.warn('Cache read error:', err);
      }
      
      // 2. Cache yoksa veya eski, API'den çek
      console.log('⚠️ Cache MISS, fetching:', cacheKey);
      const freshData = await queryFn();
      
      // 3. Yeni veriyi cache'e kaydet
      try {
        const db = await getDB();
        await db.put(CACHE_STORE, {
          data: freshData,
          timestamp: Date.now(),
          queryKey: cacheKey,
        }, cacheKey);
        console.log('💾 Cached:', cacheKey);
      } catch (err) {
        console.warn('Cache write error:', err);
      }
      
      return freshData;
    },
    staleTime: options?.staleTime || 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: options?.enabled !== false,
    placeholderData: (previousData) => previousData as TData | undefined,
  });
}
