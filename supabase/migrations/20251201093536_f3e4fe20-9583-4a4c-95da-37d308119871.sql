-- Add XP and level system to profiles (badges table already exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Index for leaderboard
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);

COMMENT ON COLUMN public.profiles.xp IS 'Experience points for gamification';
COMMENT ON COLUMN public.profiles.level IS 'User level based on XP';