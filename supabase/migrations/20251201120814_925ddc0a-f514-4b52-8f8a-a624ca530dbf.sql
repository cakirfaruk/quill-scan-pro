-- Görev sistemi için tablolar

-- Günlük görevler tablosu
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎯',
  category TEXT NOT NULL CHECK (category IN ('social', 'content', 'analysis', 'engagement', 'premium', 'daily')),
  action_type TEXT NOT NULL,
  target_count INT NOT NULL DEFAULT 1,
  credit_reward INT NOT NULL DEFAULT 5,
  xp_reward INT NOT NULL DEFAULT 10,
  is_premium_only BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı görev ilerlemesi tablosu
CREATE TABLE IF NOT EXISTS public.user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE,
  mission_date DATE DEFAULT CURRENT_DATE,
  current_progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_id, mission_date)
);

-- Haftalık meydan okumalar tablosu
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  requirements JSONB NOT NULL DEFAULT '{}',
  credit_reward INT NOT NULL DEFAULT 100,
  xp_reward INT NOT NULL DEFAULT 50,
  badge_reward UUID REFERENCES public.badges(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı haftalık meydan okuma ilerlemesi
CREATE TABLE IF NOT EXISTS public.user_weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Görev tamamlama logu
CREATE TABLE IF NOT EXISTS public.mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID REFERENCES public.daily_missions(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly')),
  credits_earned INT NOT NULL,
  xp_earned INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles tablosuna XP ve level ekle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_missions_completed INT DEFAULT 0;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user_id ON public.user_mission_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_date ON public.user_mission_progress(mission_date);
CREATE INDEX IF NOT EXISTS idx_mission_completions_user_id ON public.mission_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_missions_active ON public.daily_missions(is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON public.weekly_challenges(start_date, end_date);

-- RLS Policies
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;

-- Herkes aktif görevleri görebilir
CREATE POLICY "Anyone can view active missions" ON public.daily_missions
  FOR SELECT USING (is_active = true);

-- Kullanıcılar kendi ilerlemelerini görebilir
CREATE POLICY "Users can view own progress" ON public.user_mission_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi ilerlemelerini güncelleyebilir
CREATE POLICY "Users can update own progress" ON public.user_mission_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi ilerlemelerini oluşturabilir
CREATE POLICY "Users can create own progress" ON public.user_mission_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Herkes aktif haftalık meydan okumaları görebilir
CREATE POLICY "Anyone can view active challenges" ON public.weekly_challenges
  FOR SELECT USING (is_active = true);

-- Kullanıcılar kendi haftalık ilerlemelerini görebilir
CREATE POLICY "Users can view own weekly progress" ON public.user_weekly_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi haftalık ilerlemelerini güncelleyebilir
CREATE POLICY "Users can update own weekly progress" ON public.user_weekly_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi haftalık ilerlemelerini oluşturabilir
CREATE POLICY "Users can create own weekly progress" ON public.user_weekly_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi tamamlama loglarını görebilir
CREATE POLICY "Users can view own completions" ON public.mission_completions
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION public.update_mission_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mission_progress_timestamp
  BEFORE UPDATE ON public.user_mission_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mission_progress_timestamp();

CREATE TRIGGER update_user_weekly_progress_timestamp
  BEFORE UPDATE ON public.user_weekly_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mission_progress_timestamp();

-- Başlangıç görevleri
INSERT INTO public.daily_missions (title, description, icon, category, action_type, target_count, credit_reward, xp_reward, sort_order, is_active)
VALUES
  ('Günün Falı', 'Bugün bir fal yaptır (Kahve, Tarot veya El Okuma)', '☕', 'analysis', 'do_analysis', 1, 10, 20, 1, true),
  ('Sosyal Kelebek', '5 gönderi beğen', '❤️', 'engagement', 'like_post', 5, 5, 10, 2, true),
  ('Hikaye Paylaş', 'Bir hikaye paylaş', '📸', 'content', 'create_story', 1, 10, 15, 3, true),
  ('Mesajlaş', '3 farklı kişiye mesaj gönder', '💬', 'social', 'send_message', 3, 8, 12, 4, true),
  ('Gönderi Paylaş', 'Feed''de bir gönderi paylaş', '📝', 'content', 'create_post', 1, 10, 15, 5, true),
  ('Yorumcu', '5 gönderiye yorum yap', '💭', 'engagement', 'comment_post', 5, 8, 12, 6, true),
  ('Arkadaş Edin', 'Yeni bir arkadaşlık isteği gönder', '👥', 'social', 'send_friend_request', 1, 15, 25, 7, true),
  ('Keşfet', 'Keşfet sayfasını ziyaret et ve 3 profil incele', '🔍', 'engagement', 'view_profile', 3, 5, 10, 8, true)
ON CONFLICT DO NOTHING;