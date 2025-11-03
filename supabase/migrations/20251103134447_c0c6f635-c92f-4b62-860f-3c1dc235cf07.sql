-- Allow anyone to send messages to anyone (not just friends)
-- This is needed for the match/other messages feature
DROP POLICY IF EXISTS "Users can send messages to friends only" ON public.messages;

CREATE POLICY "Users can send messages to anyone"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Add message_category column to help categorize messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_category text DEFAULT 'other' CHECK (message_category IN ('friend', 'match', 'other'));

-- Update existing messages to set category based on friendship status
UPDATE public.messages m
SET message_category = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.friends f
    WHERE f.status = 'accepted'
    AND ((f.user_id = m.sender_id AND f.friend_id = m.receiver_id)
         OR (f.friend_id = m.sender_id AND f.user_id = m.receiver_id))
  ) THEN 'friend'
  WHEN EXISTS (
    SELECT 1 FROM public.matches mat
    WHERE (mat.user1_id = m.sender_id AND mat.user2_id = m.receiver_id)
       OR (mat.user2_id = m.sender_id AND mat.user1_id = m.receiver_id)
  ) THEN 'match'
  ELSE 'other'
END
WHERE message_category = 'other';