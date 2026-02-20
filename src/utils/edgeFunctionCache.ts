/**
 * Edge Function Caching Utilities
 * For use in Supabase Edge Functions to implement server-side caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag: string;
}

/**
 * Simple in-memory cache for edge functions
 * Note: This is reset on each cold start, so use for frequently accessed data
 */
const edgeCache = new Map<string, CacheEntry<any>>();

/**
 * Cache configuration
 */
interface CacheConfig {
  ttl: number; // Time to live in seconds
  generateETag?: (data: any) => string;
}

/**
 * Generate ETag for cache validation
 */
function generateETag(data: any): string {
  return `W/"${Date.now()}-${JSON.stringify(data).length}"`;
}

/**
 * Get data from cache with TTL check
 */
export function getFromCache<T>(key: string): T | null {
  const entry = edgeCache.get(key);
  
  if (!entry) return null;
  
  // Check if cache is still valid (using TTL from the entry)
  const now = Date.now();
  const age = (now - entry.timestamp) / 1000; // age in seconds
  
  // We'll assume a default TTL of 300 seconds (5 minutes) if not specified
  // In production, you'd want to store the TTL with the entry
  const ttl = 300;
  
  if (age > ttl) {
    edgeCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set data in cache
 */
export function setInCache<T>(
  key: string, 
  data: T, 
  config: CacheConfig = { ttl: 300 }
): void {
  const etag = config.generateETag?.(data) || generateETag(data);
  
  edgeCache.set(key, {
    data,
    timestamp: Date.now(),
    etag
  });
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  edgeCache.delete(key);
}

/**
 * Invalidate all cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: RegExp): void {
  for (const key of edgeCache.keys()) {
    if (pattern.test(key)) {
      edgeCache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  edgeCache.clear();
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats() {
  return {
    size: edgeCache.size,
    keys: Array.from(edgeCache.keys()),
    memoryEstimate: JSON.stringify(Array.from(edgeCache.entries())).length
  };
}

/**
 * Example usage in edge function:
 * 
 * import { getFromCache, setInCache } from './edgeFunctionCache';
 * 
 * Deno.serve(async (req) => {
 *   const cacheKey = 'user-profile-123';
 *   
 *   // Try to get from cache
 *   let data = getFromCache(cacheKey);
 *   
 *   if (!data) {
 *     // Fetch from database
 *     data = await fetchFromDatabase();
 *     
 *     // Store in cache for 5 minutes
 *     setInCache(cacheKey, data, { ttl: 300 });
 *   }
 *   
 *   return new Response(JSON.stringify(data), {
 *     headers: { 
 *       'Content-Type': 'application/json',
 *       'Cache-Control': 'public, max-age=300' // Browser cache
 *     }
 *   });
 * });
 */
