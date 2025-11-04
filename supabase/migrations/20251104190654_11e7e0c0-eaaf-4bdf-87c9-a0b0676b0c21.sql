-- Add interests and zodiac sign to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS zodiac_sign text,
ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}';

-- Create friend suggestions table
CREATE TABLE IF NOT EXISTS public.friend_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compatibility_score integer NOT NULL DEFAULT 0,
  common_interests text[] DEFAULT '{}',
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dismissed boolean DEFAULT false,
  UNIQUE(user_id, suggested_user_id)
);

-- Enable RLS on friend_suggestions
ALTER TABLE public.friend_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
  ON public.friend_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can dismiss suggestions
CREATE POLICY "Users can dismiss suggestions"
  ON public.friend_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create suggestions
CREATE POLICY "System can create suggestions"
  ON public.friend_suggestions
  FOR INSERT
  WITH CHECK (true);

-- System can delete suggestions
CREATE POLICY "System can delete suggestions"
  ON public.friend_suggestions
  FOR DELETE
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_friend_suggestions_user_id ON public.friend_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_suggestions_compatibility ON public.friend_suggestions(user_id, compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON public.profiles USING GIN(interests);