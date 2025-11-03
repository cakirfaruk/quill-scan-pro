-- Add current_location column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_location TEXT;