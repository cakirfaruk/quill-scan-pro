-- Create group_polls table
CREATE TABLE public.group_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  multiple_choice BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group_poll_votes table
CREATE TABLE public.group_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_ids TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_polls
CREATE POLICY "Group members can view polls"
ON public.group_polls
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_polls.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can create polls"
ON public.group_polls
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_polls.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

CREATE POLICY "Group admins can delete their polls"
ON public.group_polls
FOR DELETE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_polls.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'admin'
  )
);

-- RLS Policies for group_poll_votes
CREATE POLICY "Group members can view poll votes"
ON public.group_poll_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_polls
    JOIN public.group_members ON group_members.group_id = group_polls.group_id
    WHERE group_polls.id = group_poll_votes.poll_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can vote on polls"
ON public.group_poll_votes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_polls
    JOIN public.group_members ON group_members.group_id = group_polls.group_id
    WHERE group_polls.id = group_poll_votes.poll_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own votes"
ON public.group_poll_votes
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their votes"
ON public.group_poll_votes
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indices for performance
CREATE INDEX idx_group_polls_group_id ON public.group_polls(group_id);
CREATE INDEX idx_group_polls_created_at ON public.group_polls(created_at);
CREATE INDEX idx_group_poll_votes_poll_id ON public.group_poll_votes(poll_id);
CREATE INDEX idx_group_poll_votes_user_id ON public.group_poll_votes(user_id);