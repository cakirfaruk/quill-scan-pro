import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Trophy, Heart, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface DashboardStatsProps {
  userId: string;
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    credits: 0,
    level: 1,
    xp: 0,
    newMatches: 0,
    unreadMessages: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      // Load profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, level, xp")
        .eq("user_id", userId)
        .single();

      // Load new matches count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .gte("matched_at", sevenDaysAgo.toISOString());

      // Load unread messages count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("receiver_id", userId)
        .eq("read", false);

      setStats({
        credits: profile?.credits || 0,
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        newMatches: matchCount || 0,
        unreadMessages: unreadCount || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const xpToNextLevel = stats.level * 100;
  const currentLevelXP = stats.xp % 100;
  const progressPercentage = (currentLevelXP / 100) * 100;

  const statCards = [
    {
      icon: Coins,
      label: "Krediler",
      value: stats.credits,
      color: "from-yellow-500 to-amber-500",
      onClick: () => navigate("/credits")
    },
    {
      icon: Trophy,
      label: "Seviye",
      value: stats.level,
      color: "from-purple-500 to-pink-500",
      progress: progressPercentage,
      subValue: `${currentLevelXP}/${xpToNextLevel} XP`,
      onClick: () => navigate("/badges")
    },
    {
      icon: Heart,
      label: "Yeni Eşleşmeler",
      value: stats.newMatches,
      color: "from-rose-500 to-red-500",
      onClick: () => navigate("/match")
    },
    {
      icon: MessageSquare,
      label: "Okunmamış",
      value: stats.unreadMessages,
      color: "from-blue-500 to-cyan-500",
      onClick: () => navigate("/messages")
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="hover-scale cursor-pointer overflow-hidden group"
              onClick={stat.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {stat.value > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold"
                    >
                      {stat.value}
                    </motion.span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  {stat.progress !== undefined && (
                    <div className="space-y-1">
                      <Progress value={stat.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
