-- Add filter columns to stories table
ALTER TABLE public.stories 
ADD COLUMN filter_name TEXT DEFAULT 'Normal',
ADD COLUMN filter_value TEXT DEFAULT 'none';