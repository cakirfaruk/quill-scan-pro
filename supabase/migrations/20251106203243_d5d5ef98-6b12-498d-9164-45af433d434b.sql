-- Add reply_to column to messages table for message replies
ALTER TABLE public.messages
ADD COLUMN reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL;