
-- Drop existing seed data to update with realistic pricing
DELETE FROM analysis_prices;
DELETE FROM credit_packages;
DELETE FROM special_packages;

-- Update analysis_prices with realistic market-based pricing
INSERT INTO analysis_prices (analysis_type, display_name, description, credit_cost, icon, category, is_repeatable, cooldown_hours, sort_order) VALUES
('daily_horoscope', 'Günlük Burç Yorumu', 'Kişiselleştirilmiş günlük burç yorumunuz', 5, '🌅', 'horoscope', true, 24, 1),
('tarot', 'Tarot Falı', 'Detaylı 3 kartlık tarot açılımı', 25, '🎴', 'fortune', true, 0, 2),
('coffee', 'Kahve Falı', 'Fincan fotoğraflarından detaylı fal yorumu', 25, '☕', 'fortune', true, 0, 3),
('dream', 'Rüya Tabiri', 'Rüyanızın derinlemesine analizi', 15, '🌙', 'interpretation', true, 0, 4),
('palmistry', 'El Falı', 'Avuç içi çizgilerinden kader analizi', 40, '✋', 'analysis', false, 0, 5),
('numerology', 'Numeroloji', 'İsim ve doğum tarihinden sayısal analiz', 75, '🔢', 'analysis', false, 0, 6),
('birth_chart', 'Doğum Haritası', 'Detaylı astrolojik doğum haritası', 100, '⭐', 'analysis', false, 0, 7),
('compatibility', 'Uyumluluk Analizi', 'İki kişi arası astrolojik uyum', 80, '💕', 'analysis', true, 0, 8),
('oracle', 'Oracle Sorusu', 'Mistik AI danışmanından cevap', 3, '🔮', 'oracle', true, 0, 9),
('handwriting', 'El Yazısı Analizi', 'El yazısından kişilik analizi', 35, '✍️', 'analysis', false, 0, 10);

-- Update credit_packages with better pricing structure
DELETE FROM credit_packages;
INSERT INTO credit_packages (name, description, credits, price_try, is_active) VALUES
('Mini Paket', 'Başlangıç için ideal', 30, 29.99, true),
('Standart Paket', '%20 değerinde bonus', 100, 79.99, true),
('Premium Paket', '%33 değerinde bonus', 300, 199.99, true),
('Ultimate Paket', '%47 değerinde bonus', 750, 399.99, true),
('Mega Paket', 'En avantajlı paket - %55 bonus', 2000, 899.99, true);

-- Create time_based_packages table for subscription-like packages
CREATE TABLE IF NOT EXISTS public.time_based_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  package_type TEXT NOT NULL, -- 'daily_horoscope', 'tarot', 'coffee', 'oracle', 'match_tarot'
  duration_days INTEGER NOT NULL,
  usage_limit INTEGER, -- NULL = unlimited, number = max uses
  credit_cost INTEGER NOT NULL,
  original_credit_value INTEGER NOT NULL, -- What it would cost without package
  icon TEXT DEFAULT '📦',
  category TEXT DEFAULT 'general', -- 'horoscope', 'fortune', 'match', 'oracle', 'bundle'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_active_packages to track user's purchased packages
CREATE TABLE IF NOT EXISTS public.user_active_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id UUID REFERENCES time_based_packages(id),
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0,
  notification_hour INTEGER DEFAULT 8, -- Hour of day for notifications (0-23)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create package_usage_logs to track usage
CREATE TABLE IF NOT EXISTS public.package_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  active_package_id UUID REFERENCES user_active_packages(id),
  usage_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create flash_deals for time-limited campaigns
CREATE TABLE IF NOT EXISTS public.flash_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL, -- 'package', 'credit', 'analysis'
  reference_id UUID, -- Reference to package or other item
  original_price INTEGER NOT NULL,
  deal_price INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_purchases INTEGER, -- NULL = unlimited
  current_purchases INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT '🔥',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_notification_preferences for package notifications
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  daily_horoscope_hour INTEGER DEFAULT 8,
  daily_horoscope_enabled BOOLEAN DEFAULT true,
  package_reminders_enabled BOOLEAN DEFAULT true,
  deal_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE time_based_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_active_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_based_packages (public read)
CREATE POLICY "Anyone can view active packages" ON time_based_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON time_based_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_active_packages
CREATE POLICY "Users can view their active packages" ON user_active_packages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their packages" ON user_active_packages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their packages" ON user_active_packages
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for package_usage_logs
CREATE POLICY "Users can view their usage logs" ON package_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert usage logs" ON package_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for flash_deals (public read)
CREATE POLICY "Anyone can view active deals" ON flash_deals
  FOR SELECT USING (is_active = true AND ends_at > now());

CREATE POLICY "Admins can manage deals" ON flash_deals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can manage their preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insert time-based packages
INSERT INTO time_based_packages (name, description, package_type, duration_days, usage_limit, credit_cost, original_credit_value, icon, category, sort_order) VALUES
-- Daily Horoscope Packages
('7 Günlük Burç', '7 gün boyunca her gün otomatik günlük burç yorumu + bildirim', 'daily_horoscope', 7, NULL, 25, 35, '🌅', 'horoscope', 1),
('30 Günlük Burç', '30 gün boyunca her gün otomatik günlük burç yorumu + bildirim', 'daily_horoscope', 30, NULL, 89, 150, '📆', 'horoscope', 2),
('90 Günlük Burç', '90 gün boyunca her gün otomatik günlük burç yorumu + bildirim', 'daily_horoscope', 90, NULL, 199, 450, '📅', 'horoscope', 3),

-- Tarot Packages
('Günlük 5 Tarot', 'Bugüne özel 5 tarot falı hakkı', 'tarot', 1, 5, 49, 125, '🎴', 'fortune', 10),
('Haftalık 20 Tarot', '7 gün için 20 tarot falı hakkı', 'tarot', 7, 20, 149, 500, '🃏', 'fortune', 11),
('Aylık 50 Tarot', '30 gün için 50 tarot falı hakkı', 'tarot', 30, 50, 299, 1250, '🎭', 'fortune', 12),

-- Coffee Fortune Packages
('Haftalık 10 Kahve', '7 gün için 10 kahve falı hakkı', 'coffee', 7, 10, 99, 250, '☕', 'fortune', 20),
('Aylık 25 Kahve', '30 gün için 25 kahve falı hakkı', 'coffee', 30, 25, 199, 625, '☕', 'fortune', 21),

-- Oracle Packages
('Oracle 7 Gün Sınırsız', '7 gün sınırsız Oracle sorusu', 'oracle', 7, NULL, 39, 50, '🔮', 'oracle', 30),
('Oracle 30 Gün Sınırsız', '30 gün sınırsız Oracle sorusu', 'oracle', 30, NULL, 99, 200, '🔮', 'oracle', 31),

-- Match Tarot Packages
('Günlük Match Tarot', 'Bugüne özel 10 eşleşme tarotu', 'match_tarot', 1, 10, 79, 250, '💘', 'match', 40),
('Haftalık Match Tarot', '7 gün için 50 eşleşme tarotu', 'match_tarot', 7, 50, 249, 1250, '💕', 'match', 41),

-- Bundle Packages
('Tam Keşif Paketi', 'Doğum Haritası + Numeroloji + El Falı (Tek seferlik)', 'bundle_discovery', 365, 1, 149, 215, '🌟', 'bundle', 50),
('Aşk Paketi', '2x Uyumluluk + 5x Tarot + 3x Kahve Falı', 'bundle_love', 30, 1, 199, 310, '💕', 'bundle', 51),
('Mistik Yolculuk', '10x Tarot + 10x Kahve + 5x Rüya Tabiri', 'bundle_mystic', 30, 1, 299, 575, '🔮', 'bundle', 52),
('Rüya Paketi 10', '10 rüya tabiri hakkı', 'dream', 30, 10, 99, 150, '🌙', 'fortune', 53);

-- Insert sample flash deal
INSERT INTO flash_deals (name, description, deal_type, original_price, deal_price, discount_percent, starts_at, ends_at, icon) VALUES
('Hafta Sonu Özel', 'Haftalık 20 Tarot paketi %50 indirimli!', 'package', 149, 75, 50, now(), now() + interval '2 days', '🔥');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_active_packages_user ON user_active_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_packages_active ON user_active_packages(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_package_usage_logs_user ON package_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(is_active, starts_at, ends_at);

-- Function to check if user has active package for a type
CREATE OR REPLACE FUNCTION public.has_active_package(p_user_id UUID, p_package_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_active_packages
    WHERE user_id = p_user_id
      AND package_type = p_package_type
      AND is_active = true
      AND expires_at > now()
      AND (usage_limit IS NULL OR usage_count < usage_limit)
  );
END;
$$;

-- Function to use package credit
CREATE OR REPLACE FUNCTION public.use_package_credit(p_user_id UUID, p_package_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_id UUID;
BEGIN
  -- Find active package
  SELECT id INTO v_package_id
  FROM user_active_packages
  WHERE user_id = p_user_id
    AND package_type = p_package_type
    AND is_active = true
    AND expires_at > now()
    AND (usage_limit IS NULL OR usage_count < usage_limit)
  ORDER BY expires_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_package_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Increment usage
  UPDATE user_active_packages
  SET usage_count = usage_count + 1
  WHERE id = v_package_id;

  -- Log usage
  INSERT INTO package_usage_logs (user_id, active_package_id, usage_type)
  VALUES (p_user_id, v_package_id, p_package_type);

  RETURN TRUE;
END;
$$;
