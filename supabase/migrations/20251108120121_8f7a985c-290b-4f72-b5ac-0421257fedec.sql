-- Phase 1.1: Create Storage Buckets with RLS Policies

-- Create posts bucket (for images, videos, audio)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Create stories bucket (for images and videos, 24h auto-delete handled by app)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Create profiles bucket (for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for posts bucket
CREATE POLICY "Public read access for posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload to posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own posts files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for stories bucket
CREATE POLICY "Public read access for stories"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload to stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own stories files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own stories files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for profiles bucket
CREATE POLICY "Public read access for profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload to profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Phase 1.2: Fix group_members RLS infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND role = 'admin'
  )
$$;

-- Recreate the policy using the function (no recursion)
CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
WITH CHECK (
  public.is_group_admin(auth.uid(), group_id)
);

-- Also fix other group_members policies to use the function
DROP POLICY IF EXISTS "Group admins can update members" ON public.group_members;
CREATE POLICY "Group admins can update members"
ON public.group_members
FOR UPDATE
USING (
  public.is_group_admin(auth.uid(), group_id)
);

DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
CREATE POLICY "Group admins can remove members"
ON public.group_members
FOR DELETE
USING (
  public.is_group_admin(auth.uid(), group_id)
);