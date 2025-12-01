import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Coins, Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  action_type: string;
  target_count: number;
  credit_reward: number;
  xp_reward: number;
  current_progress?: number;
  completed?: boolean;
  reward_claimed?: boolean;
}

export function DailyMissionsWidget() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active missions
      const { data: missionsData, error: missionsError } = await supabase
        .from("daily_missions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (missionsError) throw missionsError;

      // Fetch user progress for today
      const today = new Date().toISOString().split('T')[0];
      const { data: progressData, error: progressError } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_date", today);

      if (progressError) throw progressError;

      // Merge data
      const progressMap = new Map(progressData?.map(p => [p.mission_id, p]) || []);
      const mergedMissions = missionsData?.map(mission => {
        const progress = progressMap.get(mission.id);
        return {
          ...mission,
          current_progress: progress?.current_progress || 0,
          completed: progress?.completed || false,
          reward_claimed: progress?.reward_claimed || false,
        };
      }) || [];

      setMissions(mergedMissions);
    } catch (error) {
      console.error("Error loading missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (mission: Mission) => {
    if (!mission.completed || mission.reward_claimed) return;
    
    setClaiming(mission.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Update progress - mark as claimed
      const { error: progressError } = await supabase
        .from("user_mission_progress")
        .update({
          reward_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("mission_id", mission.id)
        .eq("mission_date", today);

      if (progressError) throw progressError;

      // Update user credits and XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, xp, level, total_missions_completed")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const newXP = (profile.xp || 0) + mission.xp_reward;
        const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling: 100 XP per level

        await supabase
          .from("profiles")
          .update({
            credits: profile.credits + mission.credit_reward,
            xp: newXP,
            level: newLevel,
            total_missions_completed: (profile.total_missions_completed || 0) + 1,
          })
          .eq("user_id", user.id);

        // Log transaction
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: mission.credit_reward,
          transaction_type: "mission_reward",
          description: `${mission.title} görevi tamamlandı`,
        });

        // Log completion
        await supabase.from("mission_completions").insert({
          user_id: user.id,
          mission_id: mission.id,
          mission_type: "daily",
          credits_earned: mission.credit_reward,
          xp_earned: mission.xp_reward,
        });
      }

      // Celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      toast({
        title: "Görev Tamamlandı! 🎉",
        description: `${mission.credit_reward} kredi ve ${mission.xp_reward} XP kazandınız!`,
      });

      loadMissions();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Hata",
        description: "Ödül alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = missions.filter(m => m.completed).length;
  const totalCount = missions.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Günlük Görevler
          </CardTitle>
          <Badge variant="secondary">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <Progress value={completionPercentage} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {missions.slice(0, 4).map((mission) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`
                p-3 rounded-lg border transition-all
                ${mission.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-card border-border'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{mission.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{mission.title}</h4>
                    {mission.completed && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {mission.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-yellow-500" />
                        {mission.credit_reward}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-500" />
                        {mission.xp_reward} XP
                      </span>
                    </div>
                    {mission.completed && !mission.reward_claimed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleClaimReward(mission)}
                        disabled={claiming === mission.id}
                      >
                        {claiming === mission.id ? "Alınıyor..." : "Al"}
                      </Button>
                    )}
                  </div>
                  {!mission.completed && (
                    <Progress 
                      value={(mission.current_progress || 0) / mission.target_count * 100} 
                      className="h-1.5 mt-2"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = "/daily-rewards"}
        >
          Tüm Görevleri Gör
        </Button>
      </CardContent>
    </Card>
  );
}
