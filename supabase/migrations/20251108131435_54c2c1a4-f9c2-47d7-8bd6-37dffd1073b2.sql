-- Create alert_configurations table
CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'slack')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '{}',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  slack_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all alerts
CREATE POLICY "Admins can manage alerts"
ON public.alert_configurations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_alert_configurations_updated_at
BEFORE UPDATE ON public.alert_configurations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create alert_logs table to track sent alerts
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_config_id UUID REFERENCES public.alert_configurations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can view all logs
CREATE POLICY "Admins can view alert logs"
ON public.alert_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));