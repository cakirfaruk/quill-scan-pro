-- RLS politikaları: user_moderation_logs tablosu için
-- Sadece adminler görebilir
CREATE POLICY "admin_select_moderation_logs"
ON public.user_moderation_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Sadece adminler ekleyebilir
CREATE POLICY "admin_insert_moderation_logs"
ON public.user_moderation_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fonksiyon güvenlik düzeltmeleri: search_path ayarla
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.stories
  WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_swipes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET 
    daily_swipes_remaining = 10,
    last_swipe_reset = now()
  WHERE last_swipe_reset < CURRENT_DATE;
END;
$function$;