-- Add preferred_language column to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferred_language TEXT DEFAULT 'tr' CHECK (preferred_language IN ('tr', 'en', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'ko', 'pt', 'ru', 'it'));

COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language for automatic message translation. Default is Turkish (tr).';