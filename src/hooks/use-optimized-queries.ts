import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Optimized query hooks with better caching and performance
 * Use these instead of raw useQuery/useMutation
 */

export const useOptimizedQuery = <TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) => {
  return useQuery<TData, TError>({
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    ...options,
  });
};

export const useOptimizedMutation = <TData = unknown, TError = unknown, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables>
) => {
  return useMutation<TData, TError, TVariables>(options);
};

/**
 * Hook to prefetch data for better perceived performance
 */
export const usePrefetchQuery = () => {
  const queryClient = useQueryClient();
  
  return <TData = unknown>(
    queryKey: any[],
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
  ) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000,
      ...options,
    });
  };
};

/**
 * Hook to invalidate queries efficiently
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return (queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
  };
};
