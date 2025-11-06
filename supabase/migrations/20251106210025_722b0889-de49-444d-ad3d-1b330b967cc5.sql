-- Add transcription and translation columns to messages table
ALTER TABLE public.messages
ADD COLUMN transcription TEXT,
ADD COLUMN translation TEXT,
ADD COLUMN transcription_language TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_transcription ON public.messages(id) WHERE transcription IS NOT NULL;

COMMENT ON COLUMN public.messages.transcription IS 'Cached voice message transcription';
COMMENT ON COLUMN public.messages.translation IS 'Cached voice message translation';
COMMENT ON COLUMN public.messages.transcription_language IS 'Detected language of the transcription';