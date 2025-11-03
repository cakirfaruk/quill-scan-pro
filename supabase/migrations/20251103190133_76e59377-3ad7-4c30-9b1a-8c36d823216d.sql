-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- RLS policies for videos bucket
CREATE POLICY "Users can upload their own videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create video_reactions table for reels
CREATE TABLE IF NOT EXISTS public.video_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_reactions
CREATE POLICY "Users can add reactions to videos"
ON public.video_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.video_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all reactions"
ON public.video_reactions
FOR SELECT
TO authenticated
USING (true);

-- Create video_views table for analytics
CREATE TABLE IF NOT EXISTS public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES user_videos(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  watch_duration INTEGER DEFAULT 0 -- in seconds
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_views
CREATE POLICY "Users can track their own views"
ON public.video_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Video owners can see their video views"
ON public.video_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_videos
    WHERE user_videos.id = video_views.video_id
    AND user_videos.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_reactions_video_id ON public.video_reactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reactions_user_id ON public.video_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer_id ON public.video_views(viewer_id);