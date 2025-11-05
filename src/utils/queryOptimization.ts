import { supabase } from "@/integrations/supabase/client";

/**
 * Query Optimization Utilities
 * Helps prevent N+1 query problems and optimize database access
 */

/**
 * Batch fetch profiles for multiple user IDs to prevent N+1 queries
 * Instead of fetching profiles one by one, fetch them all at once
 */
export async function batchFetchProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map();

  const uniqueIds = [...new Set(userIds)];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, full_name, profile_photo')
    .in('user_id', uniqueIds);

  if (error) {
    console.error('Error batch fetching profiles:', error);
    return new Map();
  }

  // Return as Map for O(1) lookup
  return new Map(data.map(profile => [profile.user_id, profile]));
}

/**
 * Batch fetch post likes count and user's like status
 * Prevents N+1 when showing multiple posts
 */
export async function batchFetchPostLikes(postIds: string[], userId: string) {
  if (postIds.length === 0) return { likesMap: new Map(), userLikesMap: new Map() };

  const uniqueIds = [...new Set(postIds)];

  // Fetch all likes in one query
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', uniqueIds);

  if (error) {
    console.error('Error batch fetching likes:', error);
    return { likesMap: new Map(), userLikesMap: new Map() };
  }

  // Count likes per post
  const likesMap = new Map<string, number>();
  const userLikesMap = new Map<string, boolean>();

  data.forEach(like => {
    // Count total likes
    likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
    
    // Track user's likes
    if (like.user_id === userId) {
      userLikesMap.set(like.post_id, true);
    }
  });

  return { likesMap, userLikesMap };
}

/**
 * Batch fetch comments count for multiple posts
 */
export async function batchFetchCommentsCount(postIds: string[]) {
  if (postIds.length === 0) return new Map();

  const uniqueIds = [...new Set(postIds)];

  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', uniqueIds);

  if (error) {
    console.error('Error batch fetching comments:', error);
    return new Map();
  }

  // Count comments per post
  const commentsMap = new Map<string, number>();
  data.forEach(comment => {
    commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1);
  });

  return commentsMap;
}

/**
 * Optimized feed query that fetches everything in minimal queries
 * Prevents N+1 by using joins and batch operations
 */
export async function fetchOptimizedFeed(userId: string, limit: number = 20, offset: number = 0) {
  // 1. Fetch posts with profiles in ONE query using join
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      media_url,
      media_type,
      created_at,
      shares_count,
      profiles!posts_user_id_fkey (
        username,
        full_name,
        profile_photo
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError || !posts) {
    console.error('Error fetching posts:', postsError);
    return [];
  }

  // 2. Batch fetch all likes and comments in parallel
  const postIds = posts.map(p => p.id);
  
  const [likesData, commentsData] = await Promise.all([
    batchFetchPostLikes(postIds, userId),
    batchFetchCommentsCount(postIds)
  ]);

  // 3. Combine all data
  return posts.map(post => ({
    ...post,
    profile: post.profiles,
    likes: likesData.likesMap.get(post.id) || 0,
    hasLiked: likesData.userLikesMap.get(post.id) || false,
    comments: commentsData.get(post.id) || 0
  }));
}

/**
 * Batch fetch group members to prevent N+1
 */
export async function batchFetchGroupMembers(groupIds: string[]) {
  if (groupIds.length === 0) return new Map();

  const uniqueIds = [...new Set(groupIds)];

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, user_id, role, profiles(username, full_name, profile_photo)')
    .in('group_id', uniqueIds);

  if (error) {
    console.error('Error batch fetching group members:', error);
    return new Map();
  }

  // Group members by group_id
  const membersMap = new Map<string, any[]>();
  data.forEach(member => {
    if (!membersMap.has(member.group_id)) {
      membersMap.set(member.group_id, []);
    }
    membersMap.get(member.group_id)!.push(member);
  });

  return membersMap;
}

/**
 * Cache utility for storing frequently accessed data in memory
 * Reduces database queries for static or rarely-changing data
 */
class InMemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: T) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Export cache instances for common use cases
export const profilesCache = new InMemoryCache<any>(10); // 10 minutes
export const groupsCache = new InMemoryCache<any>(5); // 5 minutes
export const hashtagsCache = new InMemoryCache<any>(15); // 15 minutes
