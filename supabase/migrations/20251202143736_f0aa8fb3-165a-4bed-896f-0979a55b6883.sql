
-- Voice prompts table
CREATE TABLE public.voice_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  prompt_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video prompts table
CREATE TABLE public.video_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  prompt_question TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_prompts ENABLE ROW LEVEL SECURITY;

-- Voice prompts policies
CREATE POLICY "Anyone can view voice prompts" ON public.voice_prompts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their voice prompt" ON public.voice_prompts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Video prompts policies
CREATE POLICY "Anyone can view video prompts" ON public.video_prompts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their video prompt" ON public.video_prompts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_voice_prompts_user ON public.voice_prompts(user_id);
CREATE INDEX idx_video_prompts_user ON public.video_prompts(user_id);
