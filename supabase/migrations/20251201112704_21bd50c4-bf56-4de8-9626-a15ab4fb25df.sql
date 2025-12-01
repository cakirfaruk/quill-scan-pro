-- Add premium match features to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_swipes_remaining INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_swipe_reset TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Function to reset daily swipes at midnight
CREATE OR REPLACE FUNCTION reset_daily_swipes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    daily_swipes_remaining = 10,
    last_swipe_reset = now()
  WHERE last_swipe_reset < CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION reset_daily_swipes IS 'Resets daily swipe count for all users at midnight';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_boost_end_time ON profiles(boost_end_time) WHERE boost_end_time IS NOT NULL;