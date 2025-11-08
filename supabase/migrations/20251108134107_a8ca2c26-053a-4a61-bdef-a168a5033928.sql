-- Add acknowledgment fields to alert_logs
ALTER TABLE public.alert_logs
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id);

-- Create alert_escalations table
CREATE TABLE IF NOT EXISTS public.alert_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  severity_levels TEXT[] NOT NULL DEFAULT ARRAY['critical'],
  alert_types TEXT[],
  escalation_delay_minutes INTEGER NOT NULL DEFAULT 30,
  escalation_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create escalation_log to track escalations
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_log_id UUID REFERENCES public.alert_logs(id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL,
  escalation_config_id UUID REFERENCES public.alert_escalations(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notification_type TEXT NOT NULL,
  recipients TEXT[] NOT NULL
);

-- RLS Policies
ALTER TABLE public.alert_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage escalations"
  ON public.alert_escalations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view escalation logs"
  ON public.escalation_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_alert_logs_acknowledged ON public.alert_logs(acknowledged, sent_at);
CREATE INDEX idx_alert_logs_severity ON public.alert_logs(severity);
CREATE INDEX idx_escalation_logs_alert ON public.escalation_logs(alert_log_id);

-- Update trigger for alert_escalations
CREATE TRIGGER update_alert_escalations_updated_at
  BEFORE UPDATE ON public.alert_escalations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to acknowledge alert
CREATE OR REPLACE FUNCTION public.acknowledge_alert(
  p_alert_log_id UUID,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.alert_logs
  SET 
    acknowledged = true,
    acknowledged_at = now(),
    acknowledged_by = p_user_id
  WHERE id = p_alert_log_id;
END;
$$;