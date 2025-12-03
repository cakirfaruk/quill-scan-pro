-- Create oracle conversations table
CREATE TABLE public.oracle_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create oracle messages table
CREATE TABLE public.oracle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.oracle_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'oracle')),
  content TEXT NOT NULL,
  context_used JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create oracle daily usage table
CREATE TABLE public.oracle_daily_usage (
  user_id UUID NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  free_questions_used INTEGER DEFAULT 0,
  paid_questions_used INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Enable RLS
ALTER TABLE public.oracle_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for oracle_conversations
CREATE POLICY "Users can view own conversations" ON public.oracle_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.oracle_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.oracle_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for oracle_messages
CREATE POLICY "Users can view messages of own conversations" ON public.oracle_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.oracle_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages to own conversations" ON public.oracle_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.oracle_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- RLS policies for oracle_daily_usage
CREATE POLICY "Users can view own usage" ON public.oracle_daily_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.oracle_daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.oracle_daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_oracle_conversations_user_id ON public.oracle_conversations(user_id);
CREATE INDEX idx_oracle_messages_conversation_id ON public.oracle_messages(conversation_id);
CREATE INDEX idx_oracle_daily_usage_user_date ON public.oracle_daily_usage(user_id, date);

-- Add Oracle badges
INSERT INTO public.badges (name, description, icon, category, rarity, criteria) VALUES
  ('Mystic Seeker', 'Oracle ile 10 sohbet yaptın', '🔮', 'oracle', 'common', '{"oracle_chats": 10}'),
  ('Star Whisperer', 'Oracle ile 50 sohbet yaptın', '⭐', 'oracle', 'rare', '{"oracle_chats": 50}'),
  ('Oracle''s Chosen', 'Oracle ile 100 sohbet yaptın', '🌟', 'oracle', 'epic', '{"oracle_chats": 100}'),
  ('Cosmic Sage', 'Oracle ile 500 sohbet yaptın', '🌌', 'oracle', 'legendary', '{"oracle_chats": 500}')
ON CONFLICT DO NOTHING;

-- Add Oracle daily mission
INSERT INTO public.daily_missions (title, description, icon, category, action_type, target_count, xp_reward, credit_reward) VALUES
  ('Oracle''a Sor', 'Mistik Oracle''a 1 soru sor', '🔮', 'engagement', 'oracle_question', 1, 15, 3)
ON CONFLICT DO NOTHING;