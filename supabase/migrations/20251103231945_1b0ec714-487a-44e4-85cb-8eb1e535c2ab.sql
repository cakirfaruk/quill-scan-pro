-- Add post_type column to posts table for distinguishing between photo, video, and reels posts
ALTER TABLE public.posts ADD COLUMN post_type TEXT CHECK (post_type IN ('photo', 'video', 'reels')) DEFAULT 'photo';

-- Create an index for faster queries filtering by post_type
CREATE INDEX idx_posts_post_type ON public.posts(post_type);

-- Update existing video posts to have post_type='video' (if they don't have it already)
UPDATE public.posts SET post_type = 'video' WHERE media_type = 'video' AND post_type IS NULL;