-- Fix functions missing search_path parameter
-- This addresses the SUPA_function_search_path_mutable warning

-- Update increment_hashtag_usage function
CREATE OR REPLACE FUNCTION public.increment_hashtag_usage(tag_text text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  hashtag_id UUID;
BEGIN
  -- Insert or update hashtag
  INSERT INTO public.hashtags (tag, usage_count, updated_at)
  VALUES (LOWER(tag_text), 1, now())
  ON CONFLICT (tag) 
  DO UPDATE SET 
    usage_count = hashtags.usage_count + 1,
    updated_at = now()
  RETURNING id INTO hashtag_id;
  
  RETURN hashtag_id;
END;
$function$;

-- Update notify_mention function
CREATE OR REPLACE FUNCTION public.notify_mention()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_post_author TEXT;
  v_post_content TEXT;
BEGIN
  -- Get post author and content
  SELECT p.user_id, pr.username, po.content
  INTO NEW.post_id, v_post_author, v_post_content
  FROM posts po
  JOIN profiles pr ON pr.user_id = po.user_id
  WHERE po.id = NEW.post_id;
  
  -- Create notification for mentioned user
  PERFORM public.create_notification(
    NEW.mentioned_user_id,
    'mention',
    'Bir Gönderide Etiketlendiniz',
    v_post_author || ' sizi bir gönderide etiketledi',
    '/feed',
    NEW.post_id
  );
  
  RETURN NEW;
END;
$function$;

-- Update notify_friend_request function
CREATE OR REPLACE FUNCTION public.notify_friend_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Update notify_new_message function
CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;