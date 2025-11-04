-- Add pinned_at column to group_messages
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add pinned_by column to track who pinned the message
ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_messages_pinned ON public.group_messages(group_id, pinned_at) WHERE pinned_at IS NOT NULL;