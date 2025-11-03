-- Video Call Rooms Table
CREATE TABLE public.video_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, ended, declined
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Polls Table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id: string, text: string, votes: number}]
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  multiple_choice BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Poll Votes Table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_ids TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Badges Table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- achievement, status, special
  criteria JSONB, -- conditions to earn badge
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Badges Table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true,
  UNIQUE(user_id, badge_id)
);

-- Add super_like to swipes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'swipes' 
    AND column_name = 'is_super_like'
  ) THEN
    ALTER TABLE public.swipes ADD COLUMN is_super_like BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Profile Boosts Table
CREATE TABLE public.profile_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL, -- daily, premium, super
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

-- Video Calls Policies
CREATE POLICY "Users can view their own video calls"
  ON public.video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create video calls"
  ON public.video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update call status"
  ON public.video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Polls Policies
CREATE POLICY "Users can view polls from friends"
  ON public.polls FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends
      WHERE status = 'accepted'
      AND ((user_id = auth.uid() AND friend_id = polls.user_id)
        OR (friend_id = auth.uid() AND user_id = polls.user_id))
    )
  );

CREATE POLICY "Users can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls"
  ON public.polls FOR DELETE
  USING (auth.uid() = user_id);

-- Poll Votes Policies
CREATE POLICY "Users can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their votes"
  ON public.poll_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their votes"
  ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Badges Policies
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User Badges Policies
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' displayed badges"
  ON public.user_badges FOR SELECT
  USING (is_displayed = true);

CREATE POLICY "Users can update their badge display"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Profile Boosts Policies
CREATE POLICY "Users can view their own boosts"
  ON public.profile_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create boosts"
  ON public.profile_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_video_calls_caller ON public.video_calls(caller_id);
CREATE INDEX idx_video_calls_receiver ON public.video_calls(receiver_id);
CREATE INDEX idx_video_calls_status ON public.video_calls(status);
CREATE INDEX idx_polls_user_id ON public.polls(user_id);
CREATE INDEX idx_polls_expires_at ON public.polls(expires_at);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_profile_boosts_user_id ON public.profile_boosts(user_id);
CREATE INDEX idx_profile_boosts_active ON public.profile_boosts(is_active, expires_at);

-- Insert some default badges
INSERT INTO public.badges (name, description, icon, category, rarity) VALUES
  ('Yeni Üye', 'Uygulamaya hoş geldiniz!', '🌟', 'status', 'common'),
  ('Sosyal Kelebek', '50 arkadaş edinin', '🦋', 'achievement', 'rare'),
  ('Falcı', '100 fal baktırın', '🔮', 'achievement', 'rare'),
  ('Yıldız Haritacısı', 'Doğum haritanızı oluşturun', '⭐', 'achievement', 'common'),
  ('Aşk Uzmanı', '10 uyumluluk analizi yapın', '💝', 'achievement', 'epic'),
  ('Premium Üye', 'Premium üyeliğinizi aktifleştirin', '👑', 'status', 'legendary'),
  ('Popüler', 'Profiliniz 1000 kez görüntülensin', '🔥', 'achievement', 'epic'),
  ('İlk Adım', 'İlk eşleşmenizi yapın', '🎯', 'achievement', 'common');

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;