import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Coins, Zap, Calendar, Award } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirements: any;
  credit_reward: number;
  xp_reward: number;
  badge_reward: string | null;
  start_date: string;
  end_date: string;
  progress_data?: any;
  completed?: boolean;
  reward_claimed?: boolean;
}

export function WeeklyChallengesCard() {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);

      if (challengesError) throw challengesError;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from("user_weekly_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      // Merge data
      const progressMap = new Map(progressData?.map(p => [p.challenge_id, p]) || []);
      const mergedChallenges = challengesData?.map(challenge => {
        const progress = progressMap.get(challenge.id);
        return {
          ...challenge,
          progress_data: progress?.progress_data || {},
          completed: progress?.completed || false,
          reward_claimed: progress?.reward_claimed || false,
        };
      }) || [];

      setChallenges(mergedChallenges);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (challenge: WeeklyChallenge) => {
    if (!challenge.completed || challenge.reward_claimed) return;
    
    setClaiming(challenge.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update progress
      const { error: progressError } = await supabase
        .from("user_weekly_progress")
        .update({
          reward_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("challenge_id", challenge.id);

      if (progressError) throw progressError;

      // Update user credits and XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, xp, level")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const newXP = (profile.xp || 0) + challenge.xp_reward;
        const newLevel = Math.floor(newXP / 100) + 1;

        await supabase
          .from("profiles")
          .update({
            credits: profile.credits + challenge.credit_reward,
            xp: newXP,
            level: newLevel,
          })
          .eq("user_id", user.id);

        // Log transaction
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: challenge.credit_reward,
          transaction_type: "challenge_reward",
          description: `${challenge.title} meydan okuması tamamlandı`,
        });

        // Award badge if applicable
        if (challenge.badge_reward) {
          await supabase.from("user_badges").insert({
            user_id: user.id,
            badge_id: challenge.badge_reward,
          });
        }
      }

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      toast({
        title: "Meydan Okuma Tamamlandı! 🏆",
        description: `${challenge.credit_reward} kredi ve ${challenge.xp_reward} XP kazandınız!`,
      });

      loadChallenges();
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

  if (challenges.length === 0) {
    return (
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            Haftalık Meydan Okumalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Bu hafta için yeni meydan okuma henüz yok. Tekrar kontrol edin!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-500" />
          Haftalık Meydan Okumalar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const daysLeft = Math.ceil(
            (new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${challenge.completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-gradient-to-br from-purple-500/10 to-background border-purple-500/30'
                }
              `}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{challenge.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1">{challenge.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {challenge.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {daysLeft} gün kaldı
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      {challenge.credit_reward}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-500" />
                      {challenge.xp_reward} XP
                    </span>
                    {challenge.badge_reward && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-500" />
                        Rozet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {challenge.completed && !challenge.reward_claimed && (
                <Button
                  onClick={() => handleClaimReward(challenge)}
                  disabled={claiming === challenge.id}
                  className="w-full"
                  variant="default"
                >
                  {claiming === challenge.id ? "Alınıyor..." : "Ödülü Al"}
                </Button>
              )}

              {challenge.completed && challenge.reward_claimed && (
                <div className="text-center py-2 text-sm text-green-600 font-semibold">
                  ✓ Tamamlandı ve ödül alındı
                </div>
              )}

              {!challenge.completed && (
                <Progress value={0} className="mt-3" />
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
