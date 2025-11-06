-- ============================================
-- PERFORMANCE OPTIMIZATION: Critical Indexes
-- ============================================

-- 1. Profiles - Username search and user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_is_online ON public.profiles(user_id, is_online);

-- 2. Messages - Conversation queries (MOST CRITICAL FOR CHAT PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_created ON public.messages(receiver_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 3. Posts - Feed queries (VERY CRITICAL FOR FEED PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 4. Friends - Friend list queries
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON public.friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend_status ON public.friends(friend_id, status);

-- 5. Post Likes - Like count aggregation (CRITICAL FOR FEED)
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- 6. Group Messages - Chat history (CRITICAL FOR GROUP CHAT)
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON public.group_messages(sender_id);

-- 7. Group Members - Member lookups
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members(group_id, user_id);

-- 8. Stories - Active stories lookup
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON public.stories(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at DESC);

-- 9. Swipes - Match algorithm
CREATE INDEX IF NOT EXISTS idx_swipes_user_target ON public.swipes(user_id, target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_user ON public.swipes(target_user_id, user_id);

-- 10. Analysis History - User analysis lookup
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_created ON public.analysis_history(user_id, created_at DESC);

-- 11. Call Logs - Call history
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_started ON public.call_logs(caller_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_started ON public.call_logs(receiver_id, started_at DESC);

-- Update statistics for query planner optimization
ANALYZE public.profiles;
ANALYZE public.messages;
ANALYZE public.posts;
ANALYZE public.friends;
ANALYZE public.post_likes;
ANALYZE public.group_messages;
ANALYZE public.group_members;