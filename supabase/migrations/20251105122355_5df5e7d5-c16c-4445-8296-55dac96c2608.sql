-- Add error alert columns to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS error_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_severity_threshold TEXT NOT NULL DEFAULT 'error',
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add check constraint for severity threshold
ALTER TABLE public.notification_preferences
DROP CONSTRAINT IF EXISTS notification_preferences_severity_check;

ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_severity_check 
CHECK (alert_severity_threshold IN ('info', 'warning', 'error'));