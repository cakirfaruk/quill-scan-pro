-- Add tarot_reading column to matches table to store tarot reading results
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS tarot_reading jsonb;