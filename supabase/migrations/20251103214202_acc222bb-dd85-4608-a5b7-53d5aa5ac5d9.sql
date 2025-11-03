-- Fix 1: Add INSERT policy for notifications table
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix 2: Add visibility column to profiles for privacy control
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private'));

-- Update the profiles search policy to respect privacy settings
DROP POLICY IF EXISTS "Users can search other profiles" ON public.profiles;

CREATE POLICY "Users can search profiles based on privacy"
ON public.profiles
FOR SELECT
USING (
  visibility = 'public' OR
  user_id = auth.uid() OR
  (visibility = 'friends' AND EXISTS (
    SELECT 1 FROM friends
    WHERE status = 'accepted'
    AND ((user_id = auth.uid() AND friend_id = profiles.user_id)
      OR (friend_id = auth.uid() AND user_id = profiles.user_id))
  ))
);

-- Fix 3: Create rate_limits table for API rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can manage rate limits
CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start);