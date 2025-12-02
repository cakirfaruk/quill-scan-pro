
-- Transit notifications table
CREATE TABLE public.transit_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  transit_type TEXT NOT NULL,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  description TEXT NOT NULL,
  notification_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Close friends table
CREATE TABLE public.close_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- BFF mode preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bff_mode_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS looking_for_bff TEXT[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.transit_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Transit notifications policies
CREATE POLICY "Users can view their transit notifications" ON public.transit_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transit notifications" ON public.transit_notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Close friends policies
CREATE POLICY "Users can view their close friends" ON public.close_friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their close friends" ON public.close_friends
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_transit_notifications_user ON public.transit_notifications(user_id, notification_date);
CREATE INDEX idx_close_friends_user ON public.close_friends(user_id);
CREATE INDEX idx_close_friends_friend ON public.close_friends(friend_id);
