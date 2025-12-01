-- Add ice_breaker_questions table
CREATE TABLE IF NOT EXISTS ice_breaker_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE ice_breaker_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active questions
CREATE POLICY "Anyone can view active ice breaker questions"
  ON ice_breaker_questions
  FOR SELECT
  USING (is_active = true);

-- Insert initial ice breaker questions
INSERT INTO ice_breaker_questions (question, category) VALUES
  ('En sevdiğin mevsim hangisi ve neden?', 'hobbies'),
  ('Hafta sonu planın var mı?', 'lifestyle'),
  ('En çok hangi tür müzik dinlemeyi seversin?', 'hobbies'),
  ('Rüyalarındaki tatil nereye olurdu?', 'travel'),
  ('Kendini 3 kelimeyle nasıl tanımlarsın?', 'personality'),
  ('En sevdiğin yemek nedir?', 'lifestyle'),
  ('Hangi süper güce sahip olmak isterdin?', 'fun'),
  ('Sabah mı akşam mı insanısın?', 'lifestyle'),
  ('En son okuduğun kitap hangisiydi?', 'hobbies'),
  ('Hayalindeki meslek nedir?', 'career')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ice_breaker_questions IS 'Pre-defined conversation starter questions for matches';