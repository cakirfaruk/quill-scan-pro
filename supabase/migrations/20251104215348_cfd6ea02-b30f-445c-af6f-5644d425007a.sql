-- Add 'ringing' status to call_logs
ALTER TABLE public.call_logs 
DROP CONSTRAINT IF EXISTS call_logs_status_check;

ALTER TABLE public.call_logs 
ADD CONSTRAINT call_logs_status_check 
CHECK (status IN ('ringing', 'completed', 'missed', 'rejected', 'failed'));

-- Add call_id column to help track calls
ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS call_id TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Enable realtime for call_logs so receiver can see incoming calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;