-- Create search_history table for persistent search history
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  search_type TEXT,
  result_count INTEGER DEFAULT 0,
  clicked_result_id TEXT,
  clicked_result_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

-- Create table for trending searches
CREATE TABLE IF NOT EXISTS public.trending_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for trending searches (everyone can read)
ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending searches"
  ON public.trending_searches FOR SELECT
  USING (true);

-- System can update trending searches
CREATE POLICY "System can manage trending searches"
  ON public.trending_searches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX idx_trending_searches_count ON public.trending_searches(search_count DESC);

-- Function to update trending searches
CREATE OR REPLACE FUNCTION public.update_trending_search(search_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.trending_searches (query, search_count, last_searched_at)
  VALUES (search_query, 1, now())
  ON CONFLICT (query) 
  DO UPDATE SET 
    search_count = trending_searches.search_count + 1,
    last_searched_at = now();
END;
$$;