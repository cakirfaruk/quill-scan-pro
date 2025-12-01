import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Users, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'match' | 'mission';
  message: string;
  timestamp: string;
  avatar?: string;
  username?: string;
  link?: string;
}

interface RecentActivityProps {
  userId: string;
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    try {
      const recentActivities: Activity[] = [];

      // Load recent post likes (last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: likes } = await supabase
        .from("post_likes")
        .select(`
          created_at,
          user_id,
          profiles:user_id (username, profile_photo)
        `)
        .gte("created_at", threeDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      if (likes) {
        likes.forEach((like: any) => {
          recentActivities.push({
            id: `like-${like.created_at}`,
            type: 'like',
            message: `${like.profiles?.username || 'Birisi'} gönderini beğendi`,
            timestamp: like.created_at,
            avatar: like.profiles?.profile_photo,
            username: like.profiles?.username,
            link: '/feed'
          });
        });
      }

      // Load recent matches
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          matched_at,
          user1_id,
          user2_id
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .gte("matched_at", threeDaysAgo.toISOString())
        .order("matched_at", { ascending: false })
        .limit(3);

      if (matches) {
        for (const match of matches) {
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, profile_photo")
            .eq("user_id", otherUserId)
            .single();

          recentActivities.push({
            id: `match-${match.matched_at}`,
            type: 'match',
            message: `${profile?.username || 'Birisi'} ile eşleştiniz!`,
            timestamp: match.matched_at,
            avatar: profile?.profile_photo,
            username: profile?.username,
            link: '/match'
          });
        }
      }

      // Load recent mission completions
      const { data: missions } = await supabase
        .from("mission_completions")
        .select("completed_at, xp_earned, credits_earned")
        .eq("user_id", userId)
        .gte("completed_at", threeDaysAgo.toISOString())
        .order("completed_at", { ascending: false })
        .limit(3);

      if (missions) {
        missions.forEach((mission: any) => {
          recentActivities.push({
            id: `mission-${mission.completed_at}`,
            type: 'mission',
            message: `Görev tamamlandı! +${mission.xp_earned} XP`,
            timestamp: mission.completed_at
          });
        });
      }

      // Sort by timestamp and take first 5
      recentActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(recentActivities.slice(0, 5));
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'match':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'mission':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Son Aktiviteler
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/notifications")}
          >
            Tümünü Gör
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => activity.link && navigate(activity.link)}
            >
              {activity.avatar ? (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback>{activity.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true,
                    locale: tr 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
