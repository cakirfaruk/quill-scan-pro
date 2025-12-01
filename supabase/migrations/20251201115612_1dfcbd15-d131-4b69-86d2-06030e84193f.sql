-- Add shared_post_id and quoted_post_id columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_shared_post_id ON public.posts(shared_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON public.posts(quoted_post_id);

COMMENT ON COLUMN public.posts.shared_post_id IS 'ID of the original post when this is a repost (share without comment)';
COMMENT ON COLUMN public.posts.quoted_post_id IS 'ID of the original post when this is a quote post (share with comment)';