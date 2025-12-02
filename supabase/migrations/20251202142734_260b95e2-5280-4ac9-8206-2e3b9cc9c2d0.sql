
-- Leaderboards table for weekly/monthly rankings
CREATE TABLE public.leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Friend streaks table for messaging streaks
CREATE TABLE public.friend_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- User leagues table for tier system
CREATE TABLE public.user_leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  current_league TEXT NOT NULL DEFAULT 'bronze' CHECK (current_league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  league_xp INTEGER NOT NULL DEFAULT 0,
  promoted_at TIMESTAMP WITH TIME ZONE,
  demoted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;

-- Leaderboards policies
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
  FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboards" ON public.leaderboards
  FOR ALL USING (true) WITH CHECK (true);

-- Friend streaks policies
CREATE POLICY "Users can view their own streaks" ON public.friend_streaks
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create streaks" ON public.friend_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their streaks" ON public.friend_streaks
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- User leagues policies
CREATE POLICY "Anyone can view leagues" ON public.user_leagues
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own league" ON public.user_leagues
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_leaderboards_period ON public.leaderboards(period_type, period_start);
CREATE INDEX idx_leaderboards_rank ON public.leaderboards(period_type, period_start, rank);
CREATE INDEX idx_friend_streaks_user ON public.friend_streaks(user_id);
CREATE INDEX idx_friend_streaks_friend ON public.friend_streaks(friend_id);
CREATE INDEX idx_user_leagues_league ON public.user_leagues(current_league);

-- Function to update friend streak on message
CREATE OR REPLACE FUNCTION public.update_friend_streak()
RETURNS TRIGGER AS $$
DECLARE
  hours_since_last INTEGER;
BEGIN
  -- Update or create streak for sender -> receiver
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for message streak updates
CREATE TRIGGER on_message_sent_update_streak
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_friend_streak();

-- Function to get user league based on XP
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to sync user league with profile XP
CREATE OR REPLACE FUNCTION public.sync_user_league()
RETURNS TRIGGER AS $$
DECLARE
  new_league TEXT;
  old_league TEXT;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for league sync
CREATE TRIGGER on_profile_xp_change_sync_league
  AFTER INSERT OR UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_league();
