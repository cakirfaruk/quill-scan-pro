-- Add online status columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);