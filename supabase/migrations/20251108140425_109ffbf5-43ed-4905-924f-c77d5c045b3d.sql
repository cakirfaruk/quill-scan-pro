-- Create cron notification settings table
CREATE TABLE IF NOT EXISTS public.cron_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_on_error BOOLEAN DEFAULT true,
  email_on_success BOOLEAN DEFAULT false,
  push_on_error BOOLEAN DEFAULT true,
  push_on_success BOOLEAN DEFAULT false,
  email_recipients TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification settings
CREATE POLICY "Admins can manage notification settings"
  ON public.cron_notification_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_cron_notification_settings_updated_at
  BEFORE UPDATE ON public.cron_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send notification on cron job log insert
CREATE OR REPLACE FUNCTION public.notify_cron_job_status()
RETURNS TRIGGER AS $$
DECLARE
  v_cron_job RECORD;
  v_should_notify BOOLEAN := false;
BEGIN
  -- Get cron job details
  SELECT * INTO v_cron_job
  FROM public.cron_jobs
  WHERE id = NEW.cron_job_id;

  -- Determine if we should send notification
  -- Send on error, or on success if it's an important job
  v_should_notify := (NEW.status = 'error') OR 
                     (NEW.status = 'success' AND v_cron_job.name IN ('send-event-reminders', 'send-scheduled-messages'));

  IF v_should_notify THEN
    -- Call the edge function asynchronously
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-cron-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'cronJobLogId', NEW.id,
        'jobName', v_cron_job.name,
        'status', NEW.status,
        'message', COALESCE(NEW.error_message, 'Job completed successfully'),
        'errorDetails', NEW.error_details
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on cron_job_logs
CREATE TRIGGER notify_on_cron_job_log
  AFTER INSERT ON public.cron_job_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cron_job_status();

-- Enable pg_net extension for async HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Insert default settings
INSERT INTO public.cron_notification_settings (id, email_on_error, email_on_success, push_on_error, push_on_success)
VALUES (gen_random_uuid(), true, false, true, false)
ON CONFLICT DO NOTHING;