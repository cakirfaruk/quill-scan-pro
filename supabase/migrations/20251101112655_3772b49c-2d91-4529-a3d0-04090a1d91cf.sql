-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_id UUID
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_reference_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger for friend requests
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_username TEXT;
BEGIN
  -- Only send notification for new friend requests
  IF NEW.status = 'pending' AND (TG_OP = 'INSERT') THEN
    -- Get sender's username
    SELECT username INTO v_sender_username
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Create notification for the friend
    PERFORM public.create_notification(
      NEW.friend_id,
      'friend_request',
      'Yeni Arkadaşlık İsteği',
      v_sender_username || ' size arkadaşlık isteği gönderdi',
      '/friends',
      NEW.id
    );
  END IF;
  
  -- Send notification when request is accepted
  IF NEW.status = 'accepted' AND (TG_OP = 'UPDATE') AND (OLD.status = 'pending') THEN
    -- Get accepter's username
    SELECT username INTO v_sender_username
    FROM public.profiles
    WHERE user_id = NEW.friend_id;
    
    -- Create notification for the requester
    PERFORM public.create_notification(
      NEW.user_id,
      'friend_accepted',
      'Arkadaşlık İsteği Kabul Edildi',
      v_sender_username || ' arkadaşlık isteğinizi kabul etti',
      '/friends',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_created
AFTER INSERT OR UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.notify_friend_request();

-- Trigger for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_username TEXT;
BEGIN
  -- Get sender's username
  SELECT username INTO v_sender_username
  FROM public.profiles
  WHERE user_id = NEW.sender_id;
  
  -- Create notification for the receiver
  PERFORM public.create_notification(
    NEW.receiver_id,
    'new_message',
    'Yeni Mesaj',
    v_sender_username || ' size mesaj gönderdi',
    '/messages',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();