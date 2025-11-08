-- Add retry fields to cron_job_logs table
ALTER TABLE public.cron_job_logs
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_delay_seconds INTEGER DEFAULT 60;

-- Create index for retry queries
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_next_retry ON public.cron_job_logs(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;