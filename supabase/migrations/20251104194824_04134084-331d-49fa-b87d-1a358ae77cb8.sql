-- Create group_files table for file sharing
CREATE TABLE IF NOT EXISTS public.group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

-- Group members can view files
CREATE POLICY "Group members can view files"
ON public.group_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_files.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Group members can upload files
CREATE POLICY "Group members can upload files"
ON public.group_files
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_files.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- File uploader or group admins can delete files
CREATE POLICY "File uploader or admins can delete files"
ON public.group_files
FOR DELETE
USING (
  auth.uid() = uploaded_by
  OR EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_files.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_group_files_group_id ON public.group_files(group_id);
CREATE INDEX IF NOT EXISTS idx_group_files_uploaded_by ON public.group_files(uploaded_by);

-- Trigger for updated_at
CREATE TRIGGER update_group_files_updated_at
  BEFORE UPDATE ON public.group_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();