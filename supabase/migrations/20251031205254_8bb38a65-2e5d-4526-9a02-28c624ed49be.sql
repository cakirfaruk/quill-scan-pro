-- Create user_photos table for multiple profile photos (like Tinder)
CREATE TABLE IF NOT EXISTS public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Create user_videos table for video posts
CREATE TABLE IF NOT EXISTS public.user_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table for direct messaging between friends
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shared_analyses table for sharing test results with friends
CREATE TABLE IF NOT EXISTS public.shared_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('handwriting', 'numerology', 'birth_chart', 'compatibility')),
  shared_with_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_photos
CREATE POLICY "Users can view their own photos"
ON public.user_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their friends' photos"
ON public.user_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (user_id = auth.uid() AND friend_id = user_photos.user_id AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = user_photos.user_id AND status = 'accepted')
  )
);

CREATE POLICY "Admins can view all photos"
ON public.user_photos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own photos"
ON public.user_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
ON public.user_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
ON public.user_photos FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_videos
CREATE POLICY "Users can view their own videos"
ON public.user_videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their friends' videos"
ON public.user_videos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (user_id = auth.uid() AND friend_id = user_videos.user_id AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = user_videos.user_id AND status = 'accepted')
  )
);

CREATE POLICY "Admins can view all videos"
ON public.user_videos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own videos"
ON public.user_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
ON public.user_videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.user_videos FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to friends only"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (user_id = sender_id AND friend_id = receiver_id AND status = 'accepted')
    OR (friend_id = sender_id AND user_id = receiver_id AND status = 'accepted')
  )
);

CREATE POLICY "Users can update their received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for shared_analyses
CREATE POLICY "Users can view analyses shared with them"
ON public.shared_analyses FOR SELECT
USING (
  auth.uid() = shared_with_user_id OR 
  auth.uid() = user_id OR 
  is_public = true
);

CREATE POLICY "Admins can view all shared analyses"
ON public.shared_analyses FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can share their own analyses"
ON public.shared_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared analyses"
ON public.shared_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared analyses"
ON public.shared_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_photos_user_id ON public.user_photos(user_id);
CREATE INDEX idx_user_videos_user_id ON public.user_videos(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_shared_analyses_user_id ON public.shared_analyses(user_id);
CREATE INDEX idx_shared_analyses_shared_with ON public.shared_analyses(shared_with_user_id);