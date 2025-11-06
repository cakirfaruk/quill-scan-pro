-- Add auto_translate_messages column to profiles table
ALTER TABLE public.profiles
ADD COLUMN auto_translate_messages BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.auto_translate_messages IS 'Automatically translate incoming messages to user preferred language';