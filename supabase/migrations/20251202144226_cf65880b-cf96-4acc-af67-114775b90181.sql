
-- Passport feature for location changing
CREATE TABLE public.passport_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  virtual_location TEXT NOT NULL,
  virtual_latitude DECIMAL(10, 8),
  virtual_longitude DECIMAL(11, 8),
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Share my date feature
CREATE TABLE public.date_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  match_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  meeting_location TEXT,
  meeting_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.passport_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_shares ENABLE ROW LEVEL SECURITY;

-- Passport policies
CREATE POLICY "Users can view their passport" ON public.passport_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their passport" ON public.passport_locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Date shares policies
CREATE POLICY "Users can view their date shares" ON public.date_shares
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create date shares" ON public.date_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their date shares" ON public.date_shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their date shares" ON public.date_shares
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_passport_locations_user ON public.passport_locations(user_id);
CREATE INDEX idx_passport_locations_expires ON public.passport_locations(expires_at);
CREATE INDEX idx_date_shares_user ON public.date_shares(user_id);
CREATE INDEX idx_date_shares_shared ON public.date_shares(shared_with_user_id);
