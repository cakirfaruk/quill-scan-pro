import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift, Flame, Star, Trophy, Coins, Check, Lock } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ReferralCard } from "@/components/ReferralCard";

interface DailyReward {
  day: number;
  credits: number;
  bonus?: string;
  claimed: boolean;
}

const DAILY_REWARDS: Omit<DailyReward, "claimed">[] = [
  { day: 1, credits: 5 },
  { day: 2, credits: 10 },
  { day: 3, credits: 15 },
  { day: 4, credits: 20 },
  { day: 5, credits: 25, bonus: "🎁 Bonus!" },
  { day: 6, credits: 30 },
  { day: 7, credits: 50, bonus: "🏆 Haftalık Bonus!" },
];

export default function DailyRewards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [todayClaimed, setTodayClaimed] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits, daily_streak, last_daily_claim")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setUserCredits(profile.credits);
        setStreak(profile.daily_streak || 0);
        setLastClaim(profile.last_daily_claim);

        // Check if already claimed today
        if (profile.last_daily_claim) {
          const lastClaimDate = new Date(profile.last_daily_claim);
          const today = new Date();
          const isSameDay = lastClaimDate.toDateString() === today.toDateString();
          setTodayClaimed(isSameDay);
        }
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (todayClaimed) return;

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate new streak
      let newStreak = 1;
      if (lastClaim) {
        const lastClaimDate = new Date(lastClaim);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreak = (streak % 7) + 1;
        } else if (daysDiff > 1) {
          // Streak broken
          newStreak = 1;
        }
      }

      const todayReward = DAILY_REWARDS[(newStreak - 1) % 7];
      const creditsToAdd = todayReward.credits;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          credits: userCredits + creditsToAdd,
          daily_streak: newStreak,
          last_daily_claim: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: creditsToAdd,
        transaction_type: "daily_reward",
        description: `Gün ${newStreak} günlük ödülü`,
      });

      // Update state
      setUserCredits(userCredits + creditsToAdd);
      setStreak(newStreak);
      setLastClaim(new Date().toISOString());
      setTodayClaimed(true);

      // Celebration effects
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "Ödül Alındı! 🎉",
        description: `${creditsToAdd} kredi kazandınız!`,
      });
    } catch (error: any) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Hata",
        description: "Ödül alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container-mobile bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentDay = (streak % 7) || 7;

  return (
    <div className="page-container-mobile bg-gradient-subtle min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Gift className="w-7 h-7 text-primary" />
                    Günlük Ödüller
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Her gün giriş yap, kredi kazan!
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2">
                    <Coins className="w-4 h-4 mr-1" />
                    {userCredits} Kredi
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-orange-200 dark:border-orange-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{streak} Günlük Seri</h3>
                    <p className="text-sm text-muted-foreground">
                      {streak === 7 ? "Mükemmel! 🎉" : `Hedefe ${7 - streak} gün kaldı`}
                    </p>
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <Progress value={(streak / 7) * 100} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Rewards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DAILY_REWARDS.map((reward, index) => {
            const dayNumber = index + 1;
            const isCurrentDay = dayNumber === currentDay && !todayClaimed;
            const isPastDay = dayNumber < currentDay || (streak >= 7 && dayNumber <= currentDay);
            const isClaimed = isPastDay || (dayNumber === currentDay && todayClaimed);
            const isLocked = dayNumber > currentDay && !(streak >= 7 && dayNumber === 1);

            return (
              <motion.div
                key={dayNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`
                    relative overflow-hidden transition-all duration-300
                    ${isCurrentDay ? "border-primary border-2 shadow-lg shadow-primary/20 scale-105" : ""}
                    ${isClaimed ? "bg-muted/50" : ""}
                    ${isLocked ? "opacity-60" : ""}
                  `}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {isClaimed && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-green-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      {isLocked && (
                        <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                      )}
                      {!isLocked && (
                        <>
                          <div className={`
                            text-2xl font-bold
                            ${isCurrentDay ? "text-primary" : ""}
                            ${isClaimed ? "text-green-500" : ""}
                          `}>
                            Gün {dayNumber}
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className={`w-4 h-4 ${isCurrentDay ? "text-primary" : "text-yellow-500"}`} />
                            <span className="font-semibold">{reward.credits}</span>
                          </div>
                          {reward.bonus && (
                            <Badge variant="secondary" className="text-xs">
                              {reward.bonus}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Claim Button */}
        {!todayClaimed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30">
              <CardContent className="p-6">
                <Button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  size="lg"
                  className="w-full text-lg gap-2"
                >
                  {claiming ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      Alınıyor...
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5" />
                      Bugünün Ödülünü Al ({DAILY_REWARDS[(currentDay - 1) % 7].credits} Kredi)
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Her gün giriş yaparak serinizi sürdürün ve daha fazla ödül kazanın!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {todayClaimed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
              <CardContent className="p-6 text-center">
                <div className="inline-block p-4 bg-green-500/20 rounded-full mb-3">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Bugünün Ödülü Alındı! ✅</h3>
                <p className="text-muted-foreground">
                  Yarın tekrar gelin ve serinizi sürdürün!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referral Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ReferralCard />
        </motion.div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nasıl Çalışır?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 rounded-lg h-fit">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Günlük Giriş</h4>
                <p className="text-sm text-muted-foreground">
                  Her gün uygulamaya giriş yapın ve ücretsiz kredi kazanın
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg h-fit">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Seri Yapın</h4>
                <p className="text-sm text-muted-foreground">
                  Ardışık günlerde giriş yaparak daha fazla kredi kazanın
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg h-fit">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">7 Gün Tamamla</h4>
                <p className="text-sm text-muted-foreground">
                  7 günlük seriyi tamamlayıp 50 kredi bonus kazanın!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
