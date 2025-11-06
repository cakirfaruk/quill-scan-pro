-- Create favorite_analyses table
CREATE TABLE IF NOT EXISTS public.favorite_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID NOT NULL,
  analysis_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites"
ON public.favorite_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorite_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorites"
ON public.favorite_analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX idx_unique_favorite ON public.favorite_analyses(user_id, analysis_id, analysis_type);

-- Create indexes for better performance
CREATE INDEX idx_favorite_analyses_user_id ON public.favorite_analyses(user_id);
CREATE INDEX idx_favorite_analyses_analysis_id ON public.favorite_analyses(analysis_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_analyses;