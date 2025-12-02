
-- Fix function search_path security warnings
CREATE OR REPLACE FUNCTION public.update_friend_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.friend_streaks (user_id, friend_id, current_streak, last_interaction_at, streak_started_at)
  VALUES (NEW.sender_id, NEW.receiver_id, 1, now(), now())
  ON CONFLICT (user_id, friend_id) DO UPDATE SET
    current_streak = CASE 
      WHEN friend_streaks.last_interaction_at < now() - interval '48 hours' THEN 1
      WHEN friend_streaks.last_interaction_at < now() - interval '24 hours' THEN friend_streaks.current_streak + 1
      ELSE friend_streaks.current_streak
    END,
    longest_streak = GREATEST(
      friend_streaks.longest_streak,
      CASE 
        WHEN friend_streaks.last_interaction_at < now() - interval '48 hours' THEN 1
        WHEN friend_streaks.last_interaction_at < now() - interval '24 hours' THEN friend_streaks.current_streak + 1
        ELSE friend_streaks.current_streak
      END
    ),
    last_interaction_at = now(),
    streak_started_at = CASE 
      WHEN friend_streaks.last_interaction_at < now() - interval '48 hours' THEN now()
      ELSE friend_streaks.streak_started_at
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_league_for_xp(xp INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN xp >= 50000 THEN 'diamond'
    WHEN xp >= 25000 THEN 'platinum'
    WHEN xp >= 10000 THEN 'gold'
    WHEN xp >= 3000 THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_league()
RETURNS TRIGGER AS $$
DECLARE
  new_league TEXT;
BEGIN
  new_league := public.get_league_for_xp(NEW.xp);
  
  INSERT INTO public.user_leagues (user_id, current_league, league_xp)
  VALUES (NEW.user_id, new_league, NEW.xp)
  ON CONFLICT (user_id) DO UPDATE SET
    current_league = new_league,
    league_xp = NEW.xp,
    promoted_at = CASE 
      WHEN new_league > user_leagues.current_league THEN now()
      ELSE user_leagues.promoted_at
    END,
    demoted_at = CASE 
      WHEN new_league < user_leagues.current_league THEN now()
      ELSE user_leagues.demoted_at
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
