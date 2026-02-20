import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * Pre-configured useQuery hook with optimal caching settings
 */
export const useOptimizedQuery = <TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) => {
  return useQuery<TData, TError>({
    ...options,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 1, // Only retry failed requests once
  });
};
