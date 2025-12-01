-- Add daily rewards columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP WITH TIME ZONE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_daily_claim ON public.profiles(last_daily_claim);

-- Comment the columns
COMMENT ON COLUMN public.profiles.daily_streak IS 'Consecutive days of daily login';
COMMENT ON COLUMN public.profiles.last_daily_claim IS 'Timestamp of last daily reward claim';