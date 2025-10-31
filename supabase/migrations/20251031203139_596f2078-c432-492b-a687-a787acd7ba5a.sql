-- Add image_data column to analysis_history table for storing handwriting images
ALTER TABLE public.analysis_history 
ADD COLUMN image_data TEXT;