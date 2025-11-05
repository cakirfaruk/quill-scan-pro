import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Enhanced React Query hook with aggressive caching and smart invalidation
 * Implements multi-layer caching strategy for optimal performance
 */

export interface CacheQueryOptions<TData = unknown, TError = unknown> 
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<TData>;
  // Cache duration in minutes
  cacheDuration?: number;
  // Enable background refetch
  backgroundRefetch?: boolean;
  // Prefetch related queries
  prefetchQueries?: Array<{ queryKey: any[]; queryFn: () => Promise<any> }>;
}

export function useCacheQuery<TData = unknown, TError = unknown>(
  options: CacheQueryOptions<TData, TError>
) {
  const {
    queryKey,
    queryFn,
    cacheDuration = 10,
    backgroundRefetch = true,
    prefetchQueries = [],
    ...restOptions
  } = options;
  
  const queryClient = useQueryClient();

  // Prefetch related queries in the background
  useEffect(() => {
    if (prefetchQueries.length > 0) {
      const timer = setTimeout(() => {
        prefetchQueries.forEach(({ queryKey: prefetchKey, queryFn: prefetchFn }) => {
          queryClient.prefetchQuery({
            queryKey: prefetchKey,
            queryFn: prefetchFn,
            staleTime: cacheDuration * 60 * 1000,
          });
        });
      }, 100); // Small delay to avoid blocking main query

      return () => clearTimeout(timer);
    }
  }, [queryClient, prefetchQueries, cacheDuration]);

  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    // Data stays fresh for specified duration
    staleTime: cacheDuration * 60 * 1000,
    // Keep in cache for twice the cache duration
    gcTime: cacheDuration * 2 * 60 * 1000,
    // Background refetch if enabled and data is stale
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnMount: false,
    // Only retry once to avoid hammering the server
    retry: 1,
    retryDelay: 1000,
    ...restOptions,
  });
}

/**
 * Hook for paginated queries with optimized caching
 */
export function usePaginatedCacheQuery<TData = unknown, TError = unknown>(
  options: CacheQueryOptions<TData, TError>
) {
  return useCacheQuery({
    ...options,
    cacheDuration: options.cacheDuration || 5,
    backgroundRefetch: false, // Don't background refetch paginated data
  });
}

/**
 * Hook for infinite scroll queries with caching
 */
export function useInfiniteCacheQuery<TData = unknown, TError = unknown>(
  options: CacheQueryOptions<TData, TError>
) {
  return useCacheQuery({
    ...options,
    cacheDuration: options.cacheDuration || 5,
    backgroundRefetch: false,
  });
}

/**
 * Utility functions for manual cache management
 */
export const cacheUtils = {
  /**
   * Invalidate all queries matching a pattern
   */
  invalidatePattern: (queryClient: ReturnType<typeof useQueryClient>, pattern: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        );
      }
    });
  },

  /**
   * Prefetch multiple queries at once
   */
  prefetchBatch: async (
    queryClient: ReturnType<typeof useQueryClient>,
    queries: Array<{ queryKey: any[]; queryFn: () => Promise<any> }>
  ) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn }) =>
        queryClient.prefetchQuery({ queryKey, queryFn })
      )
    );
  },

  /**
   * Set query data directly (useful for optimistic updates)
   */
  setQueryData: <T>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: any[],
    data: T
  ) => {
    queryClient.setQueryData(queryKey, data);
  },

  /**
   * Get cached query data without triggering a fetch
   */
  getCachedData: <T>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: any[]
  ): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  }
};
