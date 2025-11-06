import { useState, useCallback } from 'react';
import { useOptimizedQuery } from './use-optimized-queries';
import { fetchPostsKeyset, batchFetchLikeCounts, batchCheckUserLikes } from '@/utils/queryOptimization';
import { supabase } from '@/integrations/supabase/client';

/**
 * Optimized feed hook that prevents N+1 queries
 * Uses keyset pagination instead of OFFSET for better performance
 */
export function useOptimizedFeed(userId: string | null) {
  const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>();
  const [lastId, setLastId] = useState<string | undefined>();

  const { data: posts, isLoading, error, refetch } = useOptimizedQuery({
    queryKey: ['feed', 'optimized', lastCreatedAt, lastId],
    queryFn: async () => {
      const posts = await fetchPostsKeyset(20, lastCreatedAt, lastId);
      
      if (posts.length === 0) return { posts: [], likeCounts: {}, userLikes: {} };

      const postIds = posts.map(p => p.id);
      
      // Batch fetch like counts and user likes
      const [likeCounts, userLikes] = await Promise.all([
        batchFetchLikeCounts(postIds),
        userId ? batchCheckUserLikes(userId, postIds) : Promise.resolve({})
      ]);

      return {
        posts,
        likeCounts,
        userLikes
      };
    },
    enabled: !!userId
  });

  const loadMore = useCallback(() => {
    if (posts?.posts && posts.posts.length > 0) {
      const lastPost = posts.posts[posts.posts.length - 1];
      setLastCreatedAt(lastPost.created_at);
      setLastId(lastPost.id);
    }
  }, [posts]);

  return {
    posts: posts?.posts || [],
    likeCounts: posts?.likeCounts || {},
    userLikes: posts?.userLikes || {},
    isLoading,
    error,
    loadMore,
    refetch
  };
}
