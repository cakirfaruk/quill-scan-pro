import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnhancedOfflineSync } from './use-enhanced-offline-sync';

/**
 * Optimistic mutation hook - UI'ı anında güncelle, hata varsa geri al
 * Offline modda queue'ya ekle
 */
export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccess,
  onError,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: any[];
  optimisticUpdate: (oldData: any, variables: TVariables) => any;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
}) {
  const queryClient = useQueryClient();
  const { addToQueue } = useEnhancedOfflineSync();

  return useMutation({
    mutationFn,
    
    // Mutation başlamadan önce (INSTANT UI UPDATE)
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot eski data
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistic update (anında UI'ı güncelle)
      queryClient.setQueryData(queryKey, (old: any) => 
        optimisticUpdate(old, variables)
      );
      
      return { previousData };
    },
    
    // Başarısız olursa geri al
    onError: (error, variables, context: any) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Offline queue'ya ekle
      addToQueue({
        type: 'post',
        data: variables,
      });
      
      onError?.(error, variables);
    },
    
    // Başarılı olursa cache'i güncelle
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.(data, variables);
    },
  });
}
