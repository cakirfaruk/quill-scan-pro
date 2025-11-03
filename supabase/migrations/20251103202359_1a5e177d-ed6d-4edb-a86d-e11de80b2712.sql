-- Fix foreign key constraints to allow cascading deletes for existing tables
-- This will allow user deletion to cascade to all related data

-- Daily horoscopes
ALTER TABLE public.daily_horoscopes
DROP CONSTRAINT IF EXISTS daily_horoscopes_user_id_fkey;

ALTER TABLE public.daily_horoscopes
ADD CONSTRAINT daily_horoscopes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Analysis history
ALTER TABLE public.analysis_history
DROP CONSTRAINT IF EXISTS analysis_history_user_id_fkey;

ALTER TABLE public.analysis_history
ADD CONSTRAINT analysis_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Birth chart analyses
ALTER TABLE public.birth_chart_analyses
DROP CONSTRAINT IF EXISTS birth_chart_analyses_user_id_fkey;

ALTER TABLE public.birth_chart_analyses
ADD CONSTRAINT birth_chart_analyses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Coffee fortune readings
ALTER TABLE public.coffee_fortune_readings
DROP CONSTRAINT IF EXISTS coffee_fortune_readings_user_id_fkey;

ALTER TABLE public.coffee_fortune_readings
ADD CONSTRAINT coffee_fortune_readings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Compatibility analyses
ALTER TABLE public.compatibility_analyses
DROP CONSTRAINT IF EXISTS compatibility_analyses_user_id_fkey;

ALTER TABLE public.compatibility_analyses
ADD CONSTRAINT compatibility_analyses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Dream interpretations
ALTER TABLE public.dream_interpretations
DROP CONSTRAINT IF EXISTS dream_interpretations_user_id_fkey;

ALTER TABLE public.dream_interpretations
ADD CONSTRAINT dream_interpretations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Numerology analyses
ALTER TABLE public.numerology_analyses
DROP CONSTRAINT IF EXISTS numerology_analyses_user_id_fkey;

ALTER TABLE public.numerology_analyses
ADD CONSTRAINT numerology_analyses_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Palmistry readings
ALTER TABLE public.palmistry_readings
DROP CONSTRAINT IF EXISTS palmistry_readings_user_id_fkey;

ALTER TABLE public.palmistry_readings
ADD CONSTRAINT palmistry_readings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Tarot readings (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tarot_readings') THEN
        ALTER TABLE public.tarot_readings
        DROP CONSTRAINT IF EXISTS tarot_readings_user_id_fkey;
        
        ALTER TABLE public.tarot_readings
        ADD CONSTRAINT tarot_readings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Credit transactions
ALTER TABLE public.credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

ALTER TABLE public.credit_transactions
ADD CONSTRAINT credit_transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;