-- Add pinned_at column to messages table for pinning functionality
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

-- Add forwarded_from column to track forwarded messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_pinned_at ON public.messages(receiver_id, pinned_at) WHERE pinned_at IS NOT NULL;