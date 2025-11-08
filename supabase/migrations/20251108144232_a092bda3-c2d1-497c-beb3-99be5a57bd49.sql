-- Add auto-disable configuration to cron_jobs table
ALTER TABLE public.cron_jobs
ADD COLUMN IF NOT EXISTS auto_disable_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failure_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS failure_window_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Create function to check and auto-disable cron jobs
CREATE OR REPLACE FUNCTION public.check_auto_disable_cron_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cron_job RECORD;
  v_failure_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only process failed jobs
  IF NEW.status != 'failed' THEN
    RETURN NEW;
  END IF;

  -- Get cron job configuration
  SELECT * INTO v_cron_job
  FROM public.cron_jobs
  WHERE id = NEW.job_id
    AND enabled = true
    AND auto_disable_enabled = true;

  -- If job not found or auto-disable not enabled, skip
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate window start time
  v_window_start := now() - (v_cron_job.failure_window_minutes || ' minutes')::INTERVAL;

  -- Count failures in the time window
  SELECT COUNT(*) INTO v_failure_count
  FROM public.cron_job_logs
  WHERE job_id = NEW.job_id
    AND status = 'failed'
    AND started_at >= v_window_start;

  -- If threshold exceeded, disable the job
  IF v_failure_count >= v_cron_job.failure_threshold THEN
    UPDATE public.cron_jobs
    SET 
      enabled = false,
      disabled_at = now(),
      disabled_reason = format(
        'Otomatik devre dışı bırakıldı: Son %s dakikada %s başarısızlık tespit edildi (Eşik: %s)',
        v_cron_job.failure_window_minutes,
        v_failure_count,
        v_cron_job.failure_threshold
      )
    WHERE id = NEW.job_id;

    -- Send notification about auto-disable
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-cron-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
      ),
      body := jsonb_build_object(
        'jobName', v_cron_job.name,
        'status', 'auto_disabled',
        'errorMessage', format(
          'Job otomatik olarak devre dışı bırakıldı. Son %s dakikada %s başarısızlık tespit edildi.',
          v_cron_job.failure_window_minutes,
          v_failure_count
        ),
        'isAutoDisable', true
      )::text
    );

    RAISE NOTICE 'Cron job % has been auto-disabled due to % failures in % minutes', 
      v_cron_job.name, v_failure_count, v_cron_job.failure_window_minutes;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-disable check
DROP TRIGGER IF EXISTS trigger_check_auto_disable ON public.cron_job_logs;
CREATE TRIGGER trigger_check_auto_disable
  AFTER INSERT ON public.cron_job_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_auto_disable_cron_job();

COMMENT ON COLUMN public.cron_jobs.auto_disable_enabled IS 'Otomatik devre dışı bırakma özelliği aktif mi';
COMMENT ON COLUMN public.cron_jobs.failure_threshold IS 'Kaç başarısızlıktan sonra devre dışı bırakılacak';
COMMENT ON COLUMN public.cron_jobs.failure_window_minutes IS 'Başarısızlıkların sayılacağı zaman penceresi (dakika)';
COMMENT ON COLUMN public.cron_jobs.disabled_at IS 'Job devre dışı bırakıldığı zaman';
COMMENT ON COLUMN public.cron_jobs.disabled_reason IS 'Job neden devre dışı bırakıldı';