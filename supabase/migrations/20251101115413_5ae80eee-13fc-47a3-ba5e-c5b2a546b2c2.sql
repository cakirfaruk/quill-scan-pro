-- Allow users to search and view other users' profiles
CREATE POLICY "Users can search other profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure friend request acceptance works properly
DROP POLICY IF EXISTS "Users can respond to friend requests" ON public.friends;

CREATE POLICY "Users can respond to friend requests"
ON public.friends
FOR UPDATE
TO authenticated
USING (auth.uid() = friend_id AND status = 'pending')
WITH CHECK (auth.uid() = friend_id);