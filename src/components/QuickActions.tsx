import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Star, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface QuickActionsProps {
  userId: string;
}

export function QuickActions({ userId }: QuickActionsProps) {
  const [todayMission, setTodayMission] = useState<any>(null);
  const [missionProgress, setMissionProgress] = useState(0);
  const [hasHoroscope, setHasHoroscope] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuickActions();
  }, [userId]);

  const loadQuickActions = async () => {
    try {
      // Load first active daily mission
      const { data: missions } = await supabase
        .from("daily_missions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1);

      if (missions && missions.length > 0) {
        const mission = missions[0];
        
        // Check completion status
        const today = new Date().toISOString().split('T')[0];
        const { data: completion } = await supabase
          .from("mission_completions")
          .select("*")
          .eq("user_id", userId)
          .eq("mission_id", mission.id)
          .gte("completed_at", today)
          .maybeSingle();

        setTodayMission(mission);
        setMissionProgress(completion ? 100 : 0);
      }

      // Check if user has daily horoscope today
      const today = new Date().toISOString().split('T')[0];
      const { data: horoscope } = await supabase
        .from("daily_horoscopes")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", today)
        .maybeSingle();

      setHasHoroscope(!!horoscope);
    } catch (error) {
      console.error("Error loading quick actions:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Hızlı Aksiyonlar</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        {/* Today's Mission */}
        {todayMission && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover-scale cursor-pointer" onClick={() => navigate("/")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Bugünün Görevi
                  {missionProgress === 100 && (
                    <Badge variant="secondary" className="ml-auto">Tamamlandı</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{todayMission.title}</p>
                  <Progress value={missionProgress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{todayMission.description}</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      +{todayMission.xp_reward} XP
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Daily Horoscope */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover-scale cursor-pointer" onClick={() => navigate("/daily-horoscope")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-violet-500" />
                Günlük Fal
                {hasHoroscope && (
                  <Badge variant="secondary" className="ml-auto">Hazır</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {hasHoroscope 
                  ? "Bugünkü falınızı görüntüleyin"
                  : "Bugün sizin için neler var?"
                }
              </p>
              <Button size="sm" variant="outline" className="w-full">
                {hasHoroscope ? "Görüntüle" : "Falımı Al"}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover-scale cursor-pointer" onClick={() => navigate("/discovery")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Yeni Analiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Tarot, kahve falı ve daha fazlası
              </p>
              <Button size="sm" variant="default" className="w-full">
                Keşfet
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
