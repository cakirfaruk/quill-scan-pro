-- Create group_calls table
CREATE TABLE IF NOT EXISTS public.group_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text UNIQUE DEFAULT gen_random_uuid()::text,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  status text NOT NULL CHECK (status IN ('ringing', 'active', 'ended')),
  started_by uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create group_call_participants table
CREATE TABLE IF NOT EXISTS public.group_call_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.group_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  duration integer DEFAULT 0,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'missed'))
);

-- Enable RLS
ALTER TABLE public.group_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_call_participants ENABLE ROW LEVEL SECURITY;

-- Group calls policies
CREATE POLICY "Group members can view group calls"
  ON public.group_calls
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_calls.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group members can create group calls"
  ON public.group_calls
  FOR INSERT
  WITH CHECK (
    auth.uid() = started_by
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_calls.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Call starter can update calls"
  ON public.group_calls
  FOR UPDATE
  USING (auth.uid() = started_by);

-- Group call participants policies
CREATE POLICY "Group members can view participants"
  ON public.group_call_participants
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_calls gc
    JOIN public.group_members gm ON gm.group_id = gc.group_id
    WHERE gc.id = group_call_participants.call_id
    AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Users can join calls"
  ON public.group_call_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON public.group_call_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_group_calls_group_id ON public.group_calls(group_id);
CREATE INDEX idx_group_calls_status ON public.group_calls(status);
CREATE INDEX idx_group_call_participants_call_id ON public.group_call_participants(call_id);
CREATE INDEX idx_group_call_participants_user_id ON public.group_call_participants(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_call_participants;