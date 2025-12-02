-- update_mission_progress_timestamp fonksiyonu için search_path düzeltmesi
CREATE OR REPLACE FUNCTION public.update_mission_progress_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;