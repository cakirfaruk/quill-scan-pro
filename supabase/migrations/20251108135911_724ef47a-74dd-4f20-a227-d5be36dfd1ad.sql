-- Create cron_jobs table to store job metadata and auto-scaling settings
CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL,
  function_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  auto_scale_enabled BOOLEAN DEFAULT false,
  min_interval_seconds INTEGER DEFAULT 60,
  max_interval_seconds INTEGER DEFAULT 3600,
  current_interval_seconds INTEGER DEFAULT 300,
  last_scale_check_at TIMESTAMP WITH TIME ZONE,
  success_rate_threshold_high DECIMAL(5,2) DEFAULT 90.00,
  success_rate_threshold_low DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins only
CREATE POLICY "Only admins can manage cron jobs"
ON public.cron_jobs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_cron_jobs_updated_at
  BEFORE UPDATE ON public.cron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.cron_jobs IS 'Stores cron job metadata and auto-scaling configuration';
COMMENT ON COLUMN public.cron_jobs.auto_scale_enabled IS 'When enabled, job interval will automatically adjust based on success rate';
COMMENT ON COLUMN public.cron_jobs.min_interval_seconds IS 'Minimum interval (fastest) when success rate is high';
COMMENT ON COLUMN public.cron_jobs.max_interval_seconds IS 'Maximum interval (slowest) when success rate is low';
COMMENT ON COLUMN public.cron_jobs.current_interval_seconds IS 'Current running interval in seconds';
COMMENT ON COLUMN public.cron_jobs.success_rate_threshold_high IS 'Success rate % above which interval decreases (faster execution)';
COMMENT ON COLUMN public.cron_jobs.success_rate_threshold_low IS 'Success rate % below which interval increases (slower execution)';