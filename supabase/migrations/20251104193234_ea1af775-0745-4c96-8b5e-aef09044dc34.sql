-- Create storage bucket for group media
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-media', 'group-media', true);

-- Add media columns to group_messages
ALTER TABLE public.group_messages
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT;

-- RLS policies for group-media bucket
CREATE POLICY "Group members can upload media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'group-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id::text = (storage.foldername(name))[2]
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can view media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'group-media'
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id::text = (storage.foldername(name))[2]
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'group-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create index for media messages
CREATE INDEX idx_group_messages_media ON public.group_messages(group_id, media_url) WHERE media_url IS NOT NULL;