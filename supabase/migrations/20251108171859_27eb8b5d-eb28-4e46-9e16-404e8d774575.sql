-- Fix user_sessions RLS policy to allow anonymous users
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

CREATE POLICY "Users can manage their own sessions or anonymous"
ON public.user_sessions
FOR ALL
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);