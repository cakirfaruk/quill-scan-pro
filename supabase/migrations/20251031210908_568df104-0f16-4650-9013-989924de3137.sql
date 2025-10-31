-- Add visibility settings to shared_analyses table
ALTER TABLE public.shared_analyses 
ADD COLUMN IF NOT EXISTS visibility_type TEXT DEFAULT 'friends' CHECK (visibility_type IN ('public', 'friends', 'specific_friends', 'friends_except')),
ADD COLUMN IF NOT EXISTS allowed_user_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_user_ids UUID[] DEFAULT NULL;

-- Update existing records to use new visibility system
UPDATE public.shared_analyses 
SET visibility_type = CASE 
  WHEN is_public = true THEN 'public'
  WHEN shared_with_user_id IS NOT NULL THEN 'specific_friends'
  ELSE 'friends'
END;

-- Add is_visible column to control if analysis details are visible
ALTER TABLE public.shared_analyses 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_analyses_visibility ON public.shared_analyses(visibility_type, is_visible);
CREATE INDEX IF NOT EXISTS idx_shared_analyses_allowed_users ON public.shared_analyses USING GIN(allowed_user_ids);
CREATE INDEX IF NOT EXISTS idx_shared_analyses_blocked_users ON public.shared_analyses USING GIN(blocked_user_ids);