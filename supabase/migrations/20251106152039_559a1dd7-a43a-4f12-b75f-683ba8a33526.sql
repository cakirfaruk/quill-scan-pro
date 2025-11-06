-- Add support for multiple media per post (carousel)
-- Add new columns for arrays
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[],
ADD COLUMN IF NOT EXISTS media_types TEXT[];

-- Migrate existing single media to arrays
UPDATE public.posts 
SET 
  media_urls = CASE WHEN media_url IS NOT NULL THEN ARRAY[media_url] ELSE NULL END,
  media_types = CASE WHEN media_type IS NOT NULL THEN ARRAY[media_type] ELSE NULL END
WHERE media_urls IS NULL;

-- Add constraint to ensure arrays have same length
ALTER TABLE public.posts 
ADD CONSTRAINT media_arrays_same_length 
CHECK (
  (media_urls IS NULL AND media_types IS NULL) OR
  (array_length(media_urls, 1) = array_length(media_types, 1))
);