-- Add analysis sharing support to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS analysis_type TEXT,
ADD COLUMN IF NOT EXISTS analysis_data JSONB;

-- Add index for analysis type filtering
CREATE INDEX IF NOT EXISTS idx_posts_analysis_type ON public.posts(analysis_type) WHERE analysis_type IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN public.posts.analysis_type IS 'Type of analysis shared: tarot, numerology, coffee_fortune, palmistry, dream, birth_chart, compatibility, horoscope';
COMMENT ON COLUMN public.posts.analysis_data IS 'Full analysis result data in JSON format';