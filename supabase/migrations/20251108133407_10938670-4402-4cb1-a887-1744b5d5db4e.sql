-- Create alert_snoozes table for temporarily muting alerts
CREATE TABLE IF NOT EXISTS public.alert_snoozes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_config_id UUID REFERENCES public.alert_configurations(id) ON DELETE CASCADE,
  alert_type TEXT,
  snooze_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE public.alert_snoozes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage snoozes"
  ON public.alert_snoozes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own snoozes"
  ON public.alert_snoozes
  FOR SELECT
  USING (auth.uid() = created_by);

-- Index for performance
CREATE INDEX idx_alert_snoozes_until ON public.alert_snoozes(snooze_until);
CREATE INDEX idx_alert_snoozes_type ON public.alert_snoozes(alert_type);
CREATE INDEX idx_alert_snoozes_config ON public.alert_snoozes(alert_config_id);

-- Function to check if alert is snoozed
CREATE OR REPLACE FUNCTION public.is_alert_snoozed(
  p_alert_type TEXT,
  p_alert_config_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.alert_snoozes
    WHERE snooze_until > now()
      AND (
        (alert_type = p_alert_type) OR
        (alert_config_id = p_alert_config_id)
      )
  );
END;
$$;

-- Function to clean up expired snoozes
CREATE OR REPLACE FUNCTION public.cleanup_expired_snoozes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.alert_snoozes
  WHERE snooze_until < now();
END;
$$;