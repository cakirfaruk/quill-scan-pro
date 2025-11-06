-- Fix profiles table RLS policy to allow viewing of public profiles
-- This enables social features like friend lists, post authors, groups, etc.

-- Add policy for authenticated users to view non-blocked profiles
CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_id NOT IN (
      SELECT blocked_user_id FROM blocked_users 
      WHERE user_id = auth.uid()
    )
  );