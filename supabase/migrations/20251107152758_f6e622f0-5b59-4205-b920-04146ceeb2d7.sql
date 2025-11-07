-- Fix security warning: Add search_path to function
CREATE OR REPLACE FUNCTION public.update_trending_search(search_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trending_searches (query, search_count, last_searched_at)
  VALUES (search_query, 1, now())
  ON CONFLICT (query) 
  DO UPDATE SET 
    search_count = trending_searches.search_count + 1,
    last_searched_at = now();
END;
$$;