-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id_created_at ON public.messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id_created_at ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friends_user_id_status ON public.friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id_status ON public.friends(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id_created_at ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_collection ON public.saved_posts(user_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON public.post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at DESC);