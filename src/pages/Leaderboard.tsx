import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Crown, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { LeagueBadge } from "@/components/LeagueBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  photo_url: string | null;
  xp: number;
  level: number;
  rank: number;
  league?: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaders, setFriendsLeaders] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<{ weekly: number | null; monthly: number | null; allTime: number | null }>({
    weekly: null,
    monthly: null,
    allTime: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Get all-time leaderboard from profiles (XP based)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, profile_photo, xp, level')
        .order('xp', { ascending: false })
        .limit(100);

      if (profiles) {
        const allTime = profiles.map((p, idx) => ({
          user_id: p.user_id,
          username: p.username || 'Kullanıcı',
          photo_url: p.profile_photo,
          xp: p.xp || 0,
          level: p.level || 1,
          rank: idx + 1,
        }));
        setAllTimeLeaders(allTime);

        // Find current user rank
        if (user) {
          const userRank = allTime.findIndex(l => l.user_id === user.id);
          setCurrentUserRank(prev => ({ ...prev, allTime: userRank >= 0 ? userRank + 1 : null }));
        }
      }

      // Get weekly leaderboard from leaderboards table
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: weeklyData } = await supabase
        .from('leaderboards')
        .select(`
          user_id,
          xp_earned,
          rank
        `)
        .eq('period_type', 'weekly')
        .gte('period_start', weekStart.toISOString())
        .order('xp_earned', { ascending: false })
        .limit(50);

      if (weeklyData && weeklyData.length > 0) {
        // Get profile info for weekly leaders
        const userIds = weeklyData.map(w => w.user_id);
        const { data: weeklyProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, profile_photo, level')
          .in('user_id', userIds);

        const profileMap = new Map(weeklyProfiles?.map(p => [p.user_id, p]) || []);
        
        const weekly = weeklyData.map((w, idx) => {
          const profile = profileMap.get(w.user_id);
          return {
            user_id: w.user_id,
            username: profile?.username || 'Kullanıcı',
            photo_url: profile?.profile_photo || null,
            xp: w.xp_earned,
            level: profile?.level || 1,
            rank: idx + 1,
          };
        });
        setWeeklyLeaders(weekly);

        if (user) {
          const userWeeklyRank = weekly.findIndex(l => l.user_id === user.id);
          setCurrentUserRank(prev => ({ ...prev, weekly: userWeeklyRank >= 0 ? userWeeklyRank + 1 : null }));
        }
      } else {
        // Fallback: use all-time data if no weekly data
        setWeeklyLeaders(allTimeLeaders.slice(0, 50));
      }

      // Get monthly leaderboard
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthlyData } = await supabase
        .from('leaderboards')
        .select('user_id, xp_earned, rank')
        .eq('period_type', 'monthly')
        .gte('period_start', monthStart.toISOString())
        .order('xp_earned', { ascending: false })
        .limit(50);

      if (monthlyData && monthlyData.length > 0) {
        const userIds = monthlyData.map(m => m.user_id);
        const { data: monthlyProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, profile_photo, level')
          .in('user_id', userIds);

        const profileMap = new Map(monthlyProfiles?.map(p => [p.user_id, p]) || []);
        
        const monthly = monthlyData.map((m, idx) => {
          const profile = profileMap.get(m.user_id);
          return {
            user_id: m.user_id,
            username: profile?.username || 'Kullanıcı',
            photo_url: profile?.profile_photo || null,
            xp: m.xp_earned,
            level: profile?.level || 1,
            rank: idx + 1,
          };
        });
        setMonthlyLeaders(monthly);

        if (user) {
          const userMonthlyRank = monthly.findIndex(l => l.user_id === user.id);
          setCurrentUserRank(prev => ({ ...prev, monthly: userMonthlyRank >= 0 ? userMonthlyRank + 1 : null }));
        }
      } else {
        setMonthlyLeaders(allTimeLeaders.slice(0, 50));
      }

      // Get friends leaderboard
      if (user) {
        const { data: friendsData } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friendsData && friendsData.length > 0) {
          const friendIds = [...friendsData.map(f => f.friend_id), user.id];
          
          const { data: friendProfiles } = await supabase
            .from('profiles')
            .select('user_id, username, profile_photo, xp, level')
            .in('user_id', friendIds)
            .order('xp', { ascending: false });

          if (friendProfiles) {
            const friends = friendProfiles.map((p, idx) => ({
              user_id: p.user_id,
              username: p.username || 'Kullanıcı',
              photo_url: p.profile_photo,
              xp: p.xp || 0,
              level: p.level || 1,
              rank: idx + 1,
            }));
            setFriendsLeaders(friends);
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
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold w-6 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default:
        return "";
    }
  };

  const LeaderboardList = ({ entries, emptyMessage }: { entries: LeaderboardEntry[]; emptyMessage?: string }) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage || "Henüz veri yok"}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card
              className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                entry.user_id === currentUserId ? 'ring-2 ring-primary' : ''
              } ${getRankBg(entry.rank)}`}
              onClick={() => navigate(`/profile/${entry.user_id}`)}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.photo_url || undefined} />
                <AvatarFallback>{entry.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{entry.username}</p>
                  <LeagueBadge xp={entry.xp} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Seviye {entry.level}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-bold text-primary">{entry.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-3 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-16" />
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold">Liderlik Tablosu</h1>
          </div>
          {currentUserRank.allTime && (
            <p className="text-muted-foreground">
              Sıralaman: <span className="font-bold text-primary">#{currentUserRank.allTime}</span>
            </p>
          )}
        </motion.div>

        {/* Top 3 Podium */}
        {!loading && allTimeLeaders.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-end justify-center gap-2 mb-6"
          >
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-14 w-14 border-2 border-gray-400">
                <AvatarImage src={allTimeLeaders[1]?.photo_url || undefined} />
                <AvatarFallback>{allTimeLeaders[1]?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-400 text-white w-16 h-16 flex flex-col items-center justify-center rounded-t-lg mt-2">
                <Medal className="w-5 h-5" />
                <span className="text-xs font-bold">2</span>
              </div>
              <p className="text-xs truncate w-16 text-center mt-1">{allTimeLeaders[1]?.username}</p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-16 w-16 border-2 border-yellow-500">
                <AvatarImage src={allTimeLeaders[0]?.photo_url || undefined} />
                <AvatarFallback>{allTimeLeaders[0]?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-white w-20 h-20 flex flex-col items-center justify-center rounded-t-lg mt-2">
                <Crown className="w-6 h-6" />
                <span className="text-sm font-bold">1</span>
              </div>
              <p className="text-xs truncate w-20 text-center mt-1 font-bold">{allTimeLeaders[0]?.username}</p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <Avatar className="h-12 w-12 border-2 border-amber-600">
                <AvatarImage src={allTimeLeaders[2]?.photo_url || undefined} />
                <AvatarFallback>{allTimeLeaders[2]?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-amber-600 text-white w-14 h-14 flex flex-col items-center justify-center rounded-t-lg mt-2">
                <Medal className="w-4 h-4" />
                <span className="text-xs font-bold">3</span>
              </div>
              <p className="text-xs truncate w-14 text-center mt-1">{allTimeLeaders[2]?.username}</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="weekly" className="text-xs">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Aylık</TabsTrigger>
            <TabsTrigger value="alltime" className="text-xs">Tüm Zaman</TabsTrigger>
            <TabsTrigger value="friends" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Arkadaş
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            {loading ? <LoadingSkeleton /> : <LeaderboardList entries={weeklyLeaders} />}
          </TabsContent>

          <TabsContent value="monthly">
            {loading ? <LoadingSkeleton /> : <LeaderboardList entries={monthlyLeaders} />}
          </TabsContent>

          <TabsContent value="alltime">
            {loading ? <LoadingSkeleton /> : <LeaderboardList entries={allTimeLeaders} />}
          </TabsContent>

          <TabsContent value="friends">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <LeaderboardList 
                entries={friendsLeaders} 
                emptyMessage="Arkadaş ekleyerek arkadaşlarınızla yarışın!"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Leaderboard;
