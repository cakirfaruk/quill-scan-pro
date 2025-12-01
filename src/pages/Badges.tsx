import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Lock, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface BadgeType {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string | null;
  rarity: string;
  earned: boolean;
  earned_at?: string;
  progress?: number;
}

const RARITY_CONFIG: Record<string, { color: string; label: string }> = {
  common: { color: "bg-gray-500", label: "Yaygın" },
  uncommon: { color: "bg-green-500", label: "Nadir" },
  rare: { color: "bg-blue-500", label: "Çok Nadir" },
  epic: { color: "bg-purple-500", label: "Epik" },
  legendary: { color: "bg-yellow-500", label: "Efsane" },
};

export default function Badges() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [stats, setStats] = useState({ earned: 0, total: 0, xp: 0, level: 1 });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("rarity", { ascending: false });

      if (badgesError) throw badgesError;

      // Load user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at, progress")
        .eq("user_id", user.id);

      if (userBadgesError) throw userBadgesError;

      const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const earnedBadgesMap = new Map(
        userBadges?.map(ub => [ub.badge_id, { earned_at: ub.earned_at, progress: ub.progress }]) || []
      );

      // Load user stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("user_id", user.id)
        .single();

      const enrichedBadges = allBadges?.map(badge => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
        earned_at: earnedBadgesMap.get(badge.id)?.earned_at,
        progress: earnedBadgesMap.get(badge.id)?.progress,
      })) || [];

      setBadges(enrichedBadges);
      setStats({
        earned: userBadges?.length || 0,
        total: allBadges?.length || 0,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
      });
    } catch (error: any) {
      console.error("Error loading badges:", error);
      toast({
        title: "Hata",
        description: "Rozetler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  if (loading) {
    return (
      <div className="page-container-mobile bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-mobile bg-gradient-subtle min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                    Rozetlerim
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {stats.earned} / {stats.total} rozet kazanıldı
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2">
                    <Star className="w-4 h-4 mr-1" />
                    Seviye {stats.level}
                  </Badge>
                  <div className="text-sm text-muted-foreground">{stats.xp} XP</div>
                </div>
              </div>
              <Progress value={(stats.earned / stats.total) * 100} className="mt-4 h-3" />
            </CardHeader>
          </Card>
        </motion.div>

        {/* Badges by Category */}
        {Object.entries(groupedBadges).map(([category, categoryBadges], catIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 capitalize">
              <Zap className="w-5 h-5 text-primary" />
              {category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoryBadges.map((badge, index) => {
                const rarityConfig = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`
                        relative overflow-hidden transition-all duration-300 h-full
                        ${badge.earned ? "border-2 border-primary shadow-lg" : "opacity-60"}
                        hover:scale-105
                      `}
                    >
                      {!badge.earned && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {badge.description}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${rarityConfig.color} text-white`}
                        >
                          {rarityConfig.label}
                        </Badge>
                        {badge.earned && badge.earned_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(badge.earned_at).toLocaleDateString("tr-TR")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
