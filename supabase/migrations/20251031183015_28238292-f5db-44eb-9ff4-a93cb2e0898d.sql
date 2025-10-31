-- Create birth chart analyses table
CREATE TABLE IF NOT EXISTS public.birth_chart_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  birth_place TEXT NOT NULL,
  selected_topics TEXT[] NOT NULL,
  credits_used INTEGER NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.birth_chart_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own birth chart analyses"
ON public.birth_chart_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own birth chart analysis"
ON public.birth_chart_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);