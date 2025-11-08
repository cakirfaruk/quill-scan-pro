-- Create cron job logs table
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  job_id INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all logs
CREATE POLICY "Admins can view cron job logs"
  ON public.cron_job_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system to insert logs
CREATE POLICY "System can insert cron job logs"
  ON public.cron_job_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs(job_name);
CREATE INDEX idx_cron_job_logs_started_at ON public.cron_job_logs(started_at DESC);
CREATE INDEX idx_cron_job_logs_status ON public.cron_job_logs(status);