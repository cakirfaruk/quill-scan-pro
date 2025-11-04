-- Add reply_to column to group_messages
ALTER TABLE public.group_messages
ADD COLUMN reply_to UUID REFERENCES public.group_messages(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_group_messages_reply_to ON public.group_messages(reply_to) WHERE reply_to IS NOT NULL;