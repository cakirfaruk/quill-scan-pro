-- Add reaction_type column to post_likes table
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'like';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_post_likes_reaction_type ON post_likes(reaction_type);

-- Update RLS policies to work with reactions (they should already work, just verifying)
-- The existing policies should cover reactions as well