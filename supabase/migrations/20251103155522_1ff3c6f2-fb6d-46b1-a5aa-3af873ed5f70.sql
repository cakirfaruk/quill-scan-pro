-- Add show_in_matches column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN show_in_matches boolean NOT NULL DEFAULT true;

-- Add comment to describe the column
COMMENT ON COLUMN public.profiles.show_in_matches IS 'Controls whether user appears in match/swipe screens';