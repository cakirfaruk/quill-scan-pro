-- Drop the existing foreign key to auth.users
ALTER TABLE public.post_comments 
DROP CONSTRAINT post_comments_user_id_fkey;

-- Add new foreign key to profiles table
ALTER TABLE public.post_comments 
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;