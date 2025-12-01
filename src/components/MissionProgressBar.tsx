import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MissionProgressBar() {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [totalMissions, setTotalMissions] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadProgress();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, () => {
        loadProgress();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level, total_missions_completed")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setXp(profile.xp || 0);
        setLevel(profile.level || 1);
        setTotalMissions(profile.total_missions_completed || 0);
        setVisible(true);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const xpToNextLevel = level * 100;
  const currentLevelXP = xp % 100;
  const progressPercentage = (currentLevelXP / 100) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Seviye {level}
              </Badge>
              <div className="flex-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{currentLevelXP}</span> / {xpToNextLevel} XP
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-primary" />
                {totalMissions} görev
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
