import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Coins, Trophy, Star, Calendar, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DailyMissionsWidget } from "@/components/DailyMissionsWidget";
import { WeeklyChallengesCard } from "@/components/WeeklyChallengesCard";
import { ReferralCard } from "@/components/ReferralCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface DailyReward {
  day: number;
  credits: number;
  bonus?: string;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, credits: 5 },
  { day: 2, credits: 10 },
  { day: 3, credits: 15 },
  { day: 4, credits: 20 },
  { day: 5, credits: 25, bonus: "+5 XP" },
  { day: 6, credits: 30 },
  { day: 7, credits: 50, bonus: "🎁 Bonus" },
];

const DailyRewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [currentLevelXP, setCurrentLevelXP] = useState(0);

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
        .select("credits, daily_streak, last_daily_claim, level, xp")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setUserCredits(profile.credits || 0);
        setStreak(profile.daily_streak || 0);
        setLastClaim(profile.last_daily_claim);
        setUserLevel(profile.level || 1);
        setCurrentLevelXP(profile.xp || 0);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (hasClaimed) {
      toast.info("Bugünkü ödülünü zaten aldın!");
      return;
    }

    setClaiming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Calculate new streak
      let newStreak = 1;
      if (lastClaim) {
        const lastClaimDate = new Date(lastClaim);
        const diffTime = now.getTime() - lastClaimDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = streak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      const currentDay = ((newStreak - 1) % 7);
      const reward = DAILY_REWARDS[currentDay];

      // Update user profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          credits: userCredits + reward.credits,
          daily_streak: newStreak,
          last_daily_claim: today,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Log the transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: reward.credits,
          transaction_type: "daily_login",
          description: `Gün ${reward.day} günlük giriş ödülü`,
        });

      if (transactionError) throw transactionError;

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(`${reward.credits} kredi kazandın! 🎉`, {
        description: reward.bonus ? `Bonus: ${reward.bonus}` : undefined,
      });

      // Reload data
      await loadUserData();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Ödül alınırken bir hata oluştu");
    } finally {
      setClaiming(false);
    }
  };

  const hasClaimed = (() => {
    if (!lastClaim) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastClaim === today;
  })();

  const currentDay = ((streak - 1) % 7);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const levelProgress = (currentLevelXP / 100) * 100;

  return (
    <div className="page-container-mobile bg-gradient-subtle min-h-screen pb-20">
      <Header />
      <div className="container mx-auto px-4 py-4 max-w-4xl space-y-4">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Ödüller & Görevler
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Coins className="w-3 h-3 mr-1" />
                    {userCredits}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    Lv {userLevel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Seviye {userLevel}</span>
                  <span>{currentLevelXP}/100 XP</span>
                </div>
                <Progress value={levelProgress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rewards" className="text-xs">
                <Gift className="w-3 h-3 mr-1" />
                Ödüller
              </TabsTrigger>
              <TabsTrigger value="missions" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Görevler
              </TabsTrigger>
              <TabsTrigger value="bonus" className="text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Bonus
              </TabsTrigger>
            </TabsList>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4 mt-4">
              {/* Streak and Claim Combined */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Flame className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{streak}</div>
                        <div className="text-xs text-muted-foreground">Gün Serisi</div>
                      </div>
                    </div>
                    {!hasClaimed ? (
                      <Button
                        onClick={handleClaimReward}
                        disabled={claiming}
                        size="sm"
                        className="h-10"
                      >
                        {claiming ? (
                          <>
                            <LoadingSpinner className="mr-2" />
                            Alınıyor...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-1" />
                            Ödülü Al
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                        ✓ Alındı
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full ${
                          i < streak % 7 ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Horizontal Scroll for Daily Rewards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    7 Günlük Ödüller
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-2">
                      {DAILY_REWARDS.map((reward) => {
                        const dayIndex = reward.day - 1;
                        const isCurrentDay = dayIndex === currentDay;
                        const isClaimed = dayIndex < streak;

                        return (
                          <Card
                            key={reward.day}
                            className={`flex-shrink-0 w-24 relative transition-all ${
                              isCurrentDay
                                ? "border-primary shadow-md scale-105"
                                : isClaimed
                                  ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/50"
                                  : "border-muted"
                            }`}
                          >
                            <CardContent className="p-3 text-center">
                              {isClaimed && (
                                <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  ✓
                                </div>
                              )}
                              <div className="text-xs font-medium mb-2">Gün {reward.day}</div>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Coins className="w-3 h-3 text-primary" />
                                <span className="text-sm font-bold">{reward.credits}</span>
                              </div>
                              {reward.bonus && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  <Star className="w-2 h-2 mr-0.5" />
                                  {reward.bonus}
                                </Badge>
                              )}
                              {isCurrentDay && (
                                <div className="text-[10px] text-primary mt-1 font-medium">Bugün</div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Missions Tab */}
            <TabsContent value="missions" className="space-y-4 mt-4">
              <DailyMissionsWidget compact />
            </TabsContent>

            {/* Bonus Tab */}
            <TabsContent value="bonus" className="space-y-4 mt-4">
              <WeeklyChallengesCard />
              <ReferralCard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default DailyRewards;
