import { useOptimizedQuery } from './use-optimized-queries';
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

  const { data: messages, isLoading, error } = useOptimizedQuery({
    queryKey: ['messages', 'optimized', currentUserId, otherUserId],
    queryFn: async () => {
      if (!currentUserId || !otherUserId) return [];
      return fetchMessagesOptimized(currentUserId, otherUserId);
    },
    enabled: !!currentUserId && !!otherUserId
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
    error
  };
}
