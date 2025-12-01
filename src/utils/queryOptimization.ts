/**
 * Query Optimization Utilities
 * Prevents N+1 queries and improves database performance
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Batch fetch user profiles to avoid N+1 queries
 * Use this when you need to fetch multiple user profiles at once
 */
export async function batchFetchProfiles(userIds: string[]) {
  if (!userIds || userIds.length === 0) return [];
  
  const uniqueIds = [...new Set(userIds)];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, full_name, profile_photo, is_online, last_seen')
    .in('user_id', uniqueIds);
  
  if (error) {
    console.error('Error batch fetching profiles:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Fetch posts with all related data in a single query (JOIN)
 * Prevents N+1 queries for post author, likes, and comments count
 */
export async function fetchPostsOptimized(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      media_url,
      media_type,
      media_urls,
      media_types,
      created_at,
      user_id,
      profiles!posts_user_id_fkey (
        user_id,
        username,
        full_name,
        profile_photo
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], profiles: [] };
  }

  return { posts: data || [], profiles: [] };
}

/**
 * Keyset pagination for better performance than OFFSET
 * Use created_at + id for stable cursor-based pagination
 */
export async function fetchPostsKeyset(
  limit = 20,
  lastCreatedAt?: string,
  lastId?: string
) {
  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      media_url,
      media_type,
      media_urls,
      media_types,
      created_at,
      user_id,
      shares_count,
      location_name,
      location_latitude,
      location_longitude,
      analysis_type,
      analysis_data,
      profiles!posts_user_id_fkey (
        user_id,
        username,
        full_name,
        profile_photo
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (lastCreatedAt && lastId) {
    query = query.or(`created_at.lt.${lastCreatedAt},and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts (keyset):', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch messages with sender profiles in a single query
 * Optimized for chat performance
 */
export async function fetchMessagesOptimized(
  senderId: string,
  receiverId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      sender_id,
      receiver_id,
      created_at,
      media_url,
      media_type,
      voice_note_url,
      voice_duration,
      gif_url,
      reply_to_message_id,
      profiles!messages_sender_id_fkey (
        user_id,
        username,
        full_name,
        profile_photo
      )
    `)
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).reverse(); // Reverse to show oldest first
}

/**
 * Fetch friends with profile data in a single query
 */
export async function fetchFriendsOptimized(userId: string, status = 'accepted') {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at,
      friend_profile:profiles!friends_friend_id_fkey (
        user_id,
        username,
        full_name,
        profile_photo,
        is_online,
        last_seen
      )
    `)
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data || [];
}

/**
 * Batch fetch like counts for multiple posts
 * More efficient than individual queries
 */
export async function batchFetchLikeCounts(postIds: string[]) {
  if (!postIds || postIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching like counts:', error);
    return {};
  }

  // Count likes per post
  const counts: Record<string, number> = {};
  data?.forEach(like => {
    counts[like.post_id] = (counts[like.post_id] || 0) + 1;
  });

  return counts;
}

/**
 * Check if current user liked multiple posts at once
 */
export async function batchCheckUserLikes(userId: string, postIds: string[]) {
  if (!postIds || postIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  if (error) {
    console.error('Error checking user likes:', error);
    return {};
  }

  const likes: Record<string, boolean> = {};
  data?.forEach(like => {
    likes[like.post_id] = true;
  });

  return likes;
}

/**
 * Fetch group messages with sender profiles optimized
 */
export async function fetchGroupMessagesOptimized(groupId: string, limit = 50) {
  const { data, error } = await supabase
    .from('group_messages')
    .select(`
      id,
      content,
      sender_id,
      group_id,
      created_at,
      media_url,
      media_type,
      profiles!group_messages_sender_id_fkey (
        user_id,
        username,
        full_name,
        profile_photo
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching group messages:', error);
    return [];
  }

  return (data || []).reverse();
}

/**
 * Profile lookup cache to reduce duplicate queries
 */
const profileCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedProfile(userId: string) {
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, full_name, profile_photo, is_online, last_seen')
    .eq('user_id', userId)
    .single();

  if (!error && data) {
    profileCache.set(userId, { data, timestamp: Date.now() });
    return data;
  }

  return null;
}

/**
 * Clear profile cache for a specific user
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}
