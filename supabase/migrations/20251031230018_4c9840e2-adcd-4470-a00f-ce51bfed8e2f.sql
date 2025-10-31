-- Create tarot readings table
CREATE TABLE IF NOT EXISTS public.tarot_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  spread_type TEXT NOT NULL,
  question TEXT,
  selected_cards JSONB NOT NULL,
  interpretation JSONB,
  credits_used INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coffee fortune readings table
CREATE TABLE IF NOT EXISTS public.coffee_fortune_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image1_data TEXT NOT NULL,
  image2_data TEXT NOT NULL,
  image3_data TEXT NOT NULL,
  interpretation JSONB,
  credits_used INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dream interpretations table
CREATE TABLE IF NOT EXISTS public.dream_interpretations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  dream_description TEXT NOT NULL,
  interpretation JSONB,
  credits_used INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily horoscope table
CREATE TABLE IF NOT EXISTS public.daily_horoscopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  horoscope_text JSONB,
  credits_used INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create palmistry readings table
CREATE TABLE IF NOT EXISTS public.palmistry_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  hand_image_data TEXT NOT NULL,
  interpretation JSONB,
  credits_used INTEGER NOT NULL DEFAULT 35,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_fortune_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_horoscopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palmistry_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tarot_readings
CREATE POLICY "Users can insert their own tarot readings"
  ON public.tarot_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tarot readings"
  ON public.tarot_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tarot readings"
  ON public.tarot_readings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for coffee_fortune_readings
CREATE POLICY "Users can insert their own coffee fortune readings"
  ON public.coffee_fortune_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own coffee fortune readings"
  ON public.coffee_fortune_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coffee fortune readings"
  ON public.coffee_fortune_readings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dream_interpretations
CREATE POLICY "Users can insert their own dream interpretations"
  ON public.dream_interpretations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dream interpretations"
  ON public.dream_interpretations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dream interpretations"
  ON public.dream_interpretations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for daily_horoscopes
CREATE POLICY "Users can insert their own daily horoscopes"
  ON public.daily_horoscopes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily horoscopes"
  ON public.daily_horoscopes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily horoscopes"
  ON public.daily_horoscopes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for palmistry_readings
CREATE POLICY "Users can insert their own palmistry readings"
  ON public.palmistry_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own palmistry readings"
  ON public.palmistry_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all palmistry readings"
  ON public.palmistry_readings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));