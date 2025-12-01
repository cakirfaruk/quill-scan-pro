-- Add ip_address column to rate_limits table for IP-based rate limiting
ALTER TABLE public.rate_limits
ADD COLUMN ip_address TEXT;

-- Add last_request_at column to track the last request time
ALTER TABLE public.rate_limits
ADD COLUMN last_request_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for efficient IP-based rate limiting queries
CREATE INDEX idx_rate_limits_ip_endpoint 
ON public.rate_limits(ip_address, endpoint, window_start) 
WHERE ip_address IS NOT NULL;

-- Create index for user-based rate limiting
CREATE INDEX idx_rate_limits_user_endpoint_new
ON public.rate_limits(user_id, endpoint, window_start) 
WHERE user_id IS NOT NULL;

-- Add index for cleanup queries
CREATE INDEX idx_rate_limits_window_start 
ON public.rate_limits(window_start DESC);