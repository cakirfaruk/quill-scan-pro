-- Add user moderation columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_banned BOOLEAN DEFAULT false,
ADD COLUMN is_suspended BOOLEAN DEFAULT false,
ADD COLUMN suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN ban_reason TEXT,
ADD COLUMN suspension_reason TEXT,
ADD COLUMN moderation_notes TEXT;

-- Create user moderation history table
CREATE TABLE public.user_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on moderation logs
ALTER TABLE public.user_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX idx_user_moderation_logs_user_id ON public.user_moderation_logs(user_id);
CREATE INDEX idx_user_moderation_logs_created_at ON public.user_moderation_logs(created_at DESC);