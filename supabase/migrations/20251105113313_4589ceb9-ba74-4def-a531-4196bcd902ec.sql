-- Create error logs table for tracking production errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'fatal')) DEFAULT 'error',
  context JSONB DEFAULT '{}'::jsonb,
  browser_info JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  fingerprint TEXT, -- For grouping similar errors
  count INTEGER DEFAULT 1, -- Track occurrence count
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance metrics table for Web Vitals tracking
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- FCP, LCP, FID, CLS, TTFB
  metric_value NUMERIC NOT NULL,
  rating TEXT CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  user_agent TEXT,
  connection_type TEXT,
  device_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON public.error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
-- Anyone can insert errors (important for tracking from all users, including logged out)
CREATE POLICY "Anyone can log errors"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own errors
CREATE POLICY "Users can view their own errors"
  ON public.error_logs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins using has_role function can view all errors
CREATE POLICY "Admins can view all errors"
  ON public.error_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update errors (mark as resolved)
CREATE POLICY "Admins can update errors"
  ON public.error_logs
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for performance_metrics
-- Anyone can insert metrics (important for collecting data from all users)
CREATE POLICY "Anyone can log performance metrics"
  ON public.performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own metrics
CREATE POLICY "Users can view their own metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all metrics
CREATE POLICY "Admins can view all metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));