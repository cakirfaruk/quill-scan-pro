-- Create group_announcements table
CREATE TABLE public.group_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Group members can view announcements"
ON public.group_announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_announcements.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can create announcements"
ON public.group_announcements
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_announcements.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Group admins can update their announcements"
ON public.group_announcements
FOR UPDATE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_announcements.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Group admins can delete announcements"
ON public.group_announcements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_announcements.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- Create indices
CREATE INDEX idx_group_announcements_group_id ON public.group_announcements(group_id);
CREATE INDEX idx_group_announcements_created_at ON public.group_announcements(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_group_announcements_updated_at
  BEFORE UPDATE ON public.group_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();