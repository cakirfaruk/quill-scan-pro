import { useHybridCache } from './use-hybrid-cache';
import { useOptimisticMutation } from './use-optimistic-mutation';
import { fetchMessagesOptimized } from '@/utils/queryOptimization';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Optimized messages hook with real-time updates
 * Prevents N+1 queries by fetching messages with profiles in single query
 */
export function useOptimizedMessages(currentUserId: string | null, otherUserId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', 'optimized', currentUserId, otherUserId];

  const { data: messages, isLoading, error } = useHybridCache(
    queryKey,
    async () => {
      if (!currentUserId || !otherUserId) return [];
      return fetchMessagesOptimized(currentUserId, otherUserId);
    },
    { enabled: !!currentUserId && !!otherUserId }
  );

  // Optimistic send message
  const sendMessage = useOptimisticMutation({
    mutationFn: async (message: any) => {
      const { data } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      return data;
    },
    queryKey,
    optimisticUpdate: (oldMessages: any[], newMessage: any) => {
      return [...oldMessages, { 
        ...newMessage, 
        id: 'temp-' + Date.now(),
        created_at: new Date().toISOString(),
      }];
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=in.(${currentUserId},${otherUserId})`
        },
        (payload) => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ 
            queryKey: ['messages', 'optimized', currentUserId, otherUserId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, queryClient]);

  return {
    messages: messages || [],
    isLoading,
    error,
    sendMessage
  };
}
