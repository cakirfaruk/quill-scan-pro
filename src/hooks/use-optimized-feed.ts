import { useState, useCallback } from 'react';
import { useHybridCache } from './use-hybrid-cache';
import { fetchPostsKeyset, batchFetchLikeCounts, batchCheckUserLikes } from '@/utils/queryOptimization';

/**
 * Optimized feed hook that prevents N+1 queries
 * Uses keyset pagination instead of OFFSET for better performance
 */
export function useOptimizedFeed(userId: string | null) {
  const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>();
  const [lastId, setLastId] = useState<string | undefined>();

  const { data: posts, isLoading, error, refetch } = useHybridCache(
    ['feed', 'optimized', lastCreatedAt, lastId],
    async () => {
      if (!userId) return { posts: [], likeCounts: {}, userLikes: {}, commentCounts: {}, savedPosts: {} };
      
      const fetchedPosts = await fetchPostsKeyset(20, lastCreatedAt, lastId);
      
      if (fetchedPosts.length === 0) return { posts: [], likeCounts: {}, userLikes: {}, commentCounts: {}, savedPosts: {} };

      const postIds = fetchedPosts.map(p => p.id);
      
      // **BATCH FETCH** - Like counts, user likes, comment counts, saved posts aynı anda
      const [likeCounts, userLikes, commentCounts, savedPosts] = await Promise.all([
        batchFetchLikeCounts(postIds),
        batchCheckUserLikes(userId, postIds),
        batchFetchCommentCounts(postIds),
        batchCheckSavedPosts(userId, postIds)
      ]);

      return {
        posts: fetchedPosts,
        likeCounts,
        userLikes,
        commentCounts,
        savedPosts
      };
    },
    { enabled: !!userId }
  );

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
    commentCounts: posts?.commentCounts || {},
    savedPosts: posts?.savedPosts || {},
    isLoading,
    error,
    loadMore,
    refetch
  };
}

// **BATCH FETCH COMMENT COUNTS**
async function batchFetchCommentCounts(postIds: string[]) {
  if (!postIds || postIds.length === 0) return {};
  
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching comment counts:', error);
    return {};
  }

  // Count comments per post
  const counts: Record<string, number> = {};
  data?.forEach(comment => {
    counts[comment.post_id] = (counts[comment.post_id] || 0) + 1;
  });

  return counts;
}

// **BATCH CHECK SAVED POSTS**
async function batchCheckSavedPosts(userId: string, postIds: string[]) {
  if (!postIds || postIds.length === 0) return {};
  
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  if (error) {
    console.error('Error checking saved posts:', error);
    return {};
  }

  const saved: Record<string, boolean> = {};
  data?.forEach(item => {
    saved[item.post_id] = true;
  });

  return saved;
}
