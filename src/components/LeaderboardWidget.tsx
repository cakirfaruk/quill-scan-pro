import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { LeagueBadge } from "@/components/LeagueBadge";

interface LeaderEntry {
  user_id: string;
  username: string;
  photo_url: string | null;
  xp: number;
  rank: number;
}

export const LeaderboardWidget = () => {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState<LeaderEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopUsers();
  }, []);

  const loadTopUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, profile_photo, xp')
        .order('xp', { ascending: false })
        .limit(5);

      if (profiles) {
        const ranked = profiles.map((p, idx) => ({
          user_id: p.user_id,
          username: p.username || '',
          photo_url: p.profile_photo,
          xp: p.xp || 0,
          rank: idx + 1,
        }));
        setTopUsers(ranked);

        // Get current user rank
        if (user) {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('user_id, xp')
            .order('xp', { ascending: false });
          
          if (allProfiles) {
            const userIndex = allProfiles.findIndex(p => p.user_id === user.id);
            if (userIndex !== -1) setCurrentUserRank(userIndex + 1);
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-xs text-muted-foreground font-bold">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Liderlik Tablosu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Liderlik Tablosu
          </CardTitle>
          {currentUserRank && (
            <span className="text-xs text-muted-foreground">
              Sıran: <span className="font-bold text-primary">#{currentUserRank}</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topUsers.map((user, idx) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/profile/${user.user_id}`)}
          >
            <div className="w-5 flex justify-center">
              {getRankIcon(user.rank)}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photo_url || undefined} />
              <AvatarFallback className="text-xs">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
            </div>
            <div className="flex items-center gap-1">
              <LeagueBadge xp={user.xp} size="sm" />
              <span className="text-xs font-bold text-primary">{user.xp.toLocaleString()}</span>
            </div>
          </motion.div>
        ))}

        <Button 
          variant="ghost" 
          className="w-full mt-2 text-xs"
          onClick={() => navigate('/leaderboard')}
        >
          Tümünü Gör
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
