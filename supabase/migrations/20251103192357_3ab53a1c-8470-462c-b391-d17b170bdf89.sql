-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocked list
CREATE POLICY "Users can view their own blocked list"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can block others
CREATE POLICY "Users can block others"
ON public.blocked_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unblock others
CREATE POLICY "Users can unblock others"
ON public.blocked_users
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update existing policies to respect blocked users
-- Update messages policy to prevent blocked users from messaging
DROP POLICY IF EXISTS "Users can send messages to anyone" ON public.messages;
CREATE POLICY "Users can send messages to non-blocked users"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (user_id = receiver_id AND blocked_user_id = sender_id)
    OR (user_id = sender_id AND blocked_user_id = receiver_id)
  )
);

-- Update messages view policy to hide messages from blocked users
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages from non-blocked users"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (user_id = auth.uid() AND blocked_user_id = sender_id)
    OR (user_id = auth.uid() AND blocked_user_id = receiver_id)
  )
);

-- Update friends policy to prevent friend requests with blocked users
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friends;
CREATE POLICY "Users can send friend requests to non-blocked users"
ON public.friends
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (user_id = auth.uid() AND blocked_user_id = friend_id)
    OR (user_id = friend_id AND blocked_user_id = auth.uid())
  )
);

-- Update friends view policy to hide blocked users
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friends;
CREATE POLICY "Users can view their non-blocked friendships"
ON public.friends
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id OR auth.uid() = friend_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_users 
    WHERE (user_id = auth.uid() AND blocked_user_id = friend_id)
    OR (user_id = auth.uid() AND blocked_user_id = user_id)
  )
);