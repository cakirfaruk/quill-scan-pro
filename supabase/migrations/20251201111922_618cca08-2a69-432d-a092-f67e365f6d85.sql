-- Add progress column to user_badges table
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN user_badges.progress IS 'Progress towards earning badge (0-100)';