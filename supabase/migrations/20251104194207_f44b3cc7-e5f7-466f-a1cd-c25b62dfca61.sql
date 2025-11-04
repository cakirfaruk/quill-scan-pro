-- Create group_events table
CREATE TABLE public.group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_participants table
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_events
CREATE POLICY "Group members can view events"
ON public.group_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_events.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create events"
ON public.group_events
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_events.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Event creators can update their events"
ON public.group_events
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events"
ON public.group_events
FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for event_participants
CREATE POLICY "Group members can view participants"
ON public.event_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_events
    JOIN public.group_members ON group_members.group_id = group_events.group_id
    WHERE group_events.id = event_participants.event_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can respond to events"
ON public.event_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_events
    JOIN public.group_members ON group_members.group_id = group_events.group_id
    WHERE group_events.id = event_participants.event_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their responses"
ON public.event_participants
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their responses"
ON public.event_participants
FOR DELETE
USING (auth.uid() = user_id);

-- Create indices
CREATE INDEX idx_group_events_group_id ON public.group_events(group_id);
CREATE INDEX idx_group_events_date ON public.group_events(event_date);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_group_events_updated_at
  BEFORE UPDATE ON public.group_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();