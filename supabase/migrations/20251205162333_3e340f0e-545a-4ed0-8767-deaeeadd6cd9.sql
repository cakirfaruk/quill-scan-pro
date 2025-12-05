-- 1. Group membership kontrolü için security definer function
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- 2. Mevcut problematik politikayı düzelt - group_members SELECT
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.group_members;

CREATE POLICY "Users can view members of groups they belong to" ON public.group_members
FOR SELECT USING (
  public.is_group_member(auth.uid(), group_id)
);

-- 3. Videos bucket için public read policy (storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Videos bucket için storage policies
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
CREATE POLICY "Anyone can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);