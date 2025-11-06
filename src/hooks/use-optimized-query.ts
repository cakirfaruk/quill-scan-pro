import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * Pre-configured useQuery hook with AGGRESSIVE caching for maximum performance
 */
export const useOptimizedQuery = <TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 15 * 60 * 1000, // 15 minutes - AGRESIF CACHE
    gcTime: 30 * 60 * 1000, // 30 minutes - AGRESIF CACHE
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // YENİ - Reconnect'te refetch yapma
    retry: 1,
  });
};
