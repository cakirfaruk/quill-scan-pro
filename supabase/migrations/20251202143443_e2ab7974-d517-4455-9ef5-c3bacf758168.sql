
-- Photo verifications table
CREATE TABLE public.photo_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  selfie_url TEXT NOT NULL,
  reference_photo_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hidden words table for message filtering
CREATE TABLE public.hidden_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Add is_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.photo_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_words ENABLE ROW LEVEL SECURITY;

-- Photo verifications policies
CREATE POLICY "Users can view their own verification" ON public.photo_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verification" ON public.photo_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their verification" ON public.photo_verifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see verified status" ON public.photo_verifications
  FOR SELECT USING (verification_status = 'verified');

-- Hidden words policies
CREATE POLICY "Users can view their hidden words" ON public.hidden_words
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add hidden words" ON public.hidden_words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their hidden words" ON public.hidden_words
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_photo_verifications_status ON public.photo_verifications(verification_status);
CREATE INDEX idx_hidden_words_user ON public.hidden_words(user_id);
