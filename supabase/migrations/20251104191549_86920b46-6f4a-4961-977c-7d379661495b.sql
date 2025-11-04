-- Create scheduled messages table
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create auto responses table
CREATE TABLE IF NOT EXISTS public.auto_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  message text NOT NULL,
  start_time time,
  end_time time,
  days_of_week text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create call logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  duration integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Scheduled messages policies
CREATE POLICY "Users can view their scheduled messages"
  ON public.scheduled_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create scheduled messages"
  ON public.scheduled_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their scheduled messages"
  ON public.scheduled_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their scheduled messages"
  ON public.scheduled_messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Auto responses policies
CREATE POLICY "Users can view their auto responses"
  ON public.auto_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their auto responses"
  ON public.auto_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their auto responses"
  ON public.auto_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their auto responses"
  ON public.auto_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Call logs policies
CREATE POLICY "Users can view their call logs"
  ON public.call_logs
  FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create call logs"
  ON public.call_logs
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their call logs"
  ON public.call_logs
  FOR UPDATE
  USING (auth.uid() = caller_id);

-- Create indexes
CREATE INDEX idx_scheduled_messages_sender ON public.scheduled_messages(sender_id);
CREATE INDEX idx_scheduled_messages_receiver ON public.scheduled_messages(receiver_id);
CREATE INDEX idx_scheduled_messages_time ON public.scheduled_messages(scheduled_for);
CREATE INDEX idx_auto_responses_user ON public.auto_responses(user_id);
CREATE INDEX idx_call_logs_caller ON public.call_logs(caller_id);
CREATE INDEX idx_call_logs_receiver ON public.call_logs(receiver_id);

-- Create function to send scheduled messages
CREATE OR REPLACE FUNCTION public.send_scheduled_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert scheduled messages that are due into messages table
  INSERT INTO public.messages (sender_id, receiver_id, content)
  SELECT sender_id, receiver_id, content
  FROM public.scheduled_messages
  WHERE scheduled_for <= now()
    AND sent = false;

  -- Mark them as sent
  UPDATE public.scheduled_messages
  SET sent = true, updated_at = now()
  WHERE scheduled_for <= now()
    AND sent = false;
END;
$$;