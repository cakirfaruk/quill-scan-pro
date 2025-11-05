-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type preferences
  enable_friend_requests BOOLEAN NOT NULL DEFAULT true,
  enable_friend_accepted BOOLEAN NOT NULL DEFAULT true,
  enable_new_messages BOOLEAN NOT NULL DEFAULT true,
  enable_mentions BOOLEAN NOT NULL DEFAULT true,
  enable_post_likes BOOLEAN NOT NULL DEFAULT true,
  enable_post_comments BOOLEAN NOT NULL DEFAULT true,
  enable_group_invites BOOLEAN NOT NULL DEFAULT true,
  enable_group_messages BOOLEAN NOT NULL DEFAULT true,
  enable_match_notifications BOOLEAN NOT NULL DEFAULT true,
  enable_analysis_results BOOLEAN NOT NULL DEFAULT true,
  
  -- Channel preferences
  enable_push_notifications BOOLEAN NOT NULL DEFAULT true,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT false,
  
  -- Notification timing
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to initialize default notification preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create notification preferences for new users
CREATE TRIGGER on_profile_created_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Create updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();