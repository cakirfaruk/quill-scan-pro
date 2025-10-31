-- Add profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Create friends table for social connections
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable RLS on friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Users can view their own friend requests and accepted friendships
CREATE POLICY "Users can view their friendships"
ON public.friends
FOR SELECT
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friends
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update friend requests they received
CREATE POLICY "Users can respond to friend requests"
ON public.friends
FOR UPDATE
USING (auth.uid() = friend_id AND status = 'pending');

-- Users can delete their own friend connections
CREATE POLICY "Users can delete friendships"
ON public.friends
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Admins can view all friendships
CREATE POLICY "Admins can view all friendships"
ON public.friends
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();