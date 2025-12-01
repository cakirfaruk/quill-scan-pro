-- FAZ 3: Social Media Features

-- Add quoted_post_id for repost/quote posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[],
  media_types TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their scheduled posts"
  ON scheduled_posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Post views for insights
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their post views"
  ON post_views
  FOR SELECT
  USING (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert post views"
  ON post_views
  FOR INSERT
  WITH CHECK (true);

-- FAZ 4: Gamification

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_credits INTEGER DEFAULT 50,
  bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
  ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

-- Add referral_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT SUBSTRING(md5(random()::text) FROM 1 FOR 8);

-- Virtual gifts table
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  cost_credits INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES virtual_gifts(id),
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gifts"
  ON virtual_gifts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their gift transactions"
  ON gift_transactions
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts"
  ON gift_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Insert some virtual gifts
INSERT INTO virtual_gifts (name, icon, cost_credits) VALUES
  ('❤️ Kalp', '❤️', 10),
  ('🌹 Gül', '🌹', 20),
  ('⭐ Yıldız', '⭐', 30),
  ('💎 Elmas', '💎', 50),
  ('👑 Taç', '👑', 100)
ON CONFLICT DO NOTHING;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_receiver ON gift_transactions(receiver_id);