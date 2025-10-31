-- Numeroloji analizleri için tablo
CREATE TABLE IF NOT EXISTS public.numerology_analyses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  selected_topics text[] NOT NULL,
  credits_used integer NOT NULL,
  result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS politikaları
ALTER TABLE public.numerology_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own numerology analysis"
ON public.numerology_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own numerology analyses"
ON public.numerology_analyses FOR SELECT
USING (auth.uid() = user_id);