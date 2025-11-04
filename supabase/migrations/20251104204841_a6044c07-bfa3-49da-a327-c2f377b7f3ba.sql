-- Create conversation pins table for user-level pinning
CREATE TABLE IF NOT EXISTS public.conversation_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'group')),
  conversation_id UUID NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_type, conversation_id)
);

-- Enable RLS
ALTER TABLE public.conversation_pins ENABLE ROW LEVEL SECURITY;

-- Users can manage their own pins
CREATE POLICY "Users can view their own pins"
ON public.conversation_pins
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pins"
ON public.conversation_pins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins"
ON public.conversation_pins
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_conversation_pins_user ON public.conversation_pins(user_id);
CREATE INDEX idx_conversation_pins_lookup ON public.conversation_pins(user_id, conversation_type, conversation_id);