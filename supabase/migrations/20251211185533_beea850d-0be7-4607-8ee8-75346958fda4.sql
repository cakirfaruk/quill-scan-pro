
-- Abonelik planları tablosu
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('weekly', 'monthly', 'yearly')),
  duration_days INTEGER NOT NULL,
  price_try NUMERIC NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  app_store_product_id TEXT,
  play_store_product_id TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kullanıcı abonelikleri tablosu
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  store_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Özel paketler tablosu
CREATE TABLE public.special_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎁',
  price_try NUMERIC NOT NULL,
  original_price_try NUMERIC,
  included_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  discount_percentage INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Satın alma geçmişi tablosu
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('credits', 'subscription', 'package')),
  item_id UUID,
  item_name TEXT,
  credits_added INTEGER DEFAULT 0,
  amount_try NUMERIC NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  store_transaction_id TEXT,
  store_receipt TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analiz fiyatları tablosu (dinamik yönetim için)
CREATE TABLE public.analysis_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type TEXT UNIQUE NOT NULL,
  credit_cost INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✨',
  category TEXT DEFAULT 'analysis',
  is_repeatable BOOLEAN DEFAULT true,
  cooldown_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_prices ENABLE ROW LEVEL SECURITY;

-- subscription_plans: Herkes aktif planları görebilir, adminler yönetebilir
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- user_subscriptions: Kullanıcılar kendi aboneliklerini görebilir
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

-- special_packages: Herkes aktif paketleri görebilir
CREATE POLICY "Anyone can view active packages" ON public.special_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage special packages" ON public.special_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- purchases: Kullanıcılar kendi satın almalarını görebilir
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all purchases" ON public.purchases
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- analysis_prices: Herkes fiyatları görebilir
CREATE POLICY "Anyone can view analysis prices" ON public.analysis_prices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage analysis prices" ON public.analysis_prices
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);

-- Seed Data: Abonelik Planları
INSERT INTO public.subscription_plans (name, description, duration_type, duration_days, price_try, bonus_credits, features, app_store_product_id, play_store_product_id, is_popular) VALUES
('Haftalık VIP', 'Tüm analizlere sınırsız erişim', 'weekly', 7, 29.99, 25, '["Tüm analizler sınırsız", "Oracle AI sınırsız", "Reklamsız deneyim", "Öncelikli destek"]'::jsonb, 'stellara_weekly_vip', 'stellara_weekly_vip', false),
('Aylık VIP', 'En popüler plan - Büyük tasarruf', 'monthly', 30, 79.99, 100, '["Tüm analizler sınırsız", "Oracle AI sınırsız", "Reklamsız deneyim", "Öncelikli destek", "Özel rozetler", "Erken erişim özellikleri"]'::jsonb, 'stellara_monthly_vip', 'stellara_monthly_vip', true),
('Yıllık VIP', 'En avantajlı plan - %40 indirim', 'yearly', 365, 599.99, 500, '["Tüm analizler sınırsız", "Oracle AI sınırsız", "Reklamsız deneyim", "Öncelikli destek", "Özel rozetler", "Erken erişim özellikleri", "VIP rozeti", "Özel tema"]'::jsonb, 'stellara_yearly_vip', 'stellara_yearly_vip', false);

-- Seed Data: Kredi Paketleri (mevcut credit_packages tablosuna ekle)
INSERT INTO public.credit_packages (name, description, credits, price_try, is_active) VALUES
('Başlangıç Paketi', 'İlk deneyim için ideal', 50, 29.99, true),
('Popüler Paket', 'En çok tercih edilen', 120, 59.99, true),
('Mega Paket', 'Büyük tasarruf fırsatı', 300, 129.99, true),
('Ultra Paket', 'Profesyonel kullanıcılar için', 600, 229.99, true),
('Yıldız Paketi', 'En avantajlı paket', 1200, 399.99, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Data: Özel Paketler
INSERT INTO public.special_packages (name, description, icon, price_try, original_price_try, included_items, discount_percentage, is_featured, sort_order) VALUES
('Romantik Keşif', 'Aşk hayatınızı keşfedin', '💕', 49.99, 75, '[{"type": "compatibility", "count": 2, "label": "Uyumluluk Analizi"}, {"type": "tarot", "count": 3, "label": "Tarot Falı"}, {"type": "credits", "count": 20, "label": "Bonus Kredi"}]'::jsonb, 33, true, 1),
('Tarot 10''lu', '10 tarot falı paketi', '🎴', 39.99, 50, '[{"type": "tarot", "count": 10, "label": "Tarot Falı"}]'::jsonb, 20, false, 2),
('Kahve 10''lu', '10 kahve falı paketi', '☕', 39.99, 50, '[{"type": "coffee", "count": 10, "label": "Kahve Falı"}]'::jsonb, 20, false, 3),
('Tam Profil', 'Kendinizi tam keşfedin', '🌟', 99.99, 150, '[{"type": "birth_chart", "count": 1, "label": "Doğum Haritası"}, {"type": "numerology", "count": 1, "label": "Numeroloji"}, {"type": "palmistry", "count": 1, "label": "El Falı"}, {"type": "credits", "count": 50, "label": "Bonus Kredi"}]'::jsonb, 33, true, 4),
('Rüya Paketi', '5 rüya tabiri', '🌙', 12.99, 15, '[{"type": "dream", "count": 5, "label": "Rüya Tabiri"}]'::jsonb, 13, false, 5),
('Oracle Sınırsız', '30 gün Oracle erişimi', '🔮', 59.99, 80, '[{"type": "oracle_unlimited", "count": 30, "label": "Gün Oracle Erişimi"}, {"type": "credits", "count": 30, "label": "Bonus Kredi"}]'::jsonb, 25, false, 6);

-- Seed Data: Analiz Fiyatları
INSERT INTO public.analysis_prices (analysis_type, credit_cost, display_name, description, icon, category, is_repeatable, cooldown_hours, sort_order) VALUES
('daily_horoscope', 1, 'Günlük Burç', 'Kişiselleştirilmiş günlük yorum', '⭐', 'horoscope', true, 24, 1),
('oracle', 2, 'Oracle Sorusu', 'AI destekli mistik danışman', '🔮', 'oracle', true, 0, 2),
('dream', 3, 'Rüya Tabiri', 'Rüyalarınızın anlamı', '🌙', 'interpretation', true, 0, 3),
('tarot', 5, 'Tarot Falı', '3 kart açılımı', '🎴', 'fortune', true, 0, 4),
('coffee', 5, 'Kahve Falı', 'Fincan yorumu', '☕', 'fortune', true, 0, 5),
('palmistry', 8, 'El Falı', 'Avuç içi analizi', '🖐️', 'analysis', false, 0, 6),
('numerology', 10, 'Numeroloji', 'Sayısal kader analizi', '🔢', 'analysis', false, 0, 7),
('birth_chart', 15, 'Doğum Haritası', 'Kapsamlı astroloji', '🌟', 'analysis', false, 0, 8),
('compatibility', 25, 'Uyumluluk', 'İki kişi arası uyum', '💕', 'compatibility', true, 0, 9);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > now()
  );
END;
$$;

-- Function to get user subscription details
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    us.expires_at,
    us.auto_renew,
    EXTRACT(DAY FROM (us.expires_at - now()))::INTEGER
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND us.expires_at > now()
  ORDER BY us.expires_at DESC
  LIMIT 1;
END;
$$;
