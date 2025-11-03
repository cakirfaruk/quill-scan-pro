import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  earned_at?: string;
  is_displayed?: boolean;
}

interface BadgeDisplayProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const BadgeDisplay = ({ userId, isOwnProfile = false }: BadgeDisplayProps) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBadges();
    if (isOwnProfile) {
      loadAllBadges();
    }
  }, [userId]);

  const loadBadges = async () => {
    try {
      const { data } = await supabase
        .from("user_badges")
        .select(`
          id,
          earned_at,
          is_displayed,
          badge:badges (
            id,
            name,
            description,
            icon,
            category,
            rarity
          )
        `)
        .eq("user_id", userId)
        .eq("is_displayed", true);

      if (data) {
        const userBadges = data.map((ub: any) => ({
          ...ub.badge,
          earned_at: ub.earned_at,
          is_displayed: ub.is_displayed,
        }));
        setBadges(userBadges);
      }
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllBadges = async () => {
    try {
      const { data: allBadgesData } = await supabase
        .from("badges")
        .select("*")
        .order("rarity", { ascending: false });

      const { data: userBadgesData } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", userId);

      if (allBadgesData) {
        const earnedBadgeIds = new Set(userBadgesData?.map((ub) => ub.badge_id) || []);
        const allBadgesWithStatus = allBadgesData.map((badge) => ({
          ...badge,
          earned_at: userBadgesData?.find((ub) => ub.badge_id === badge.id)?.earned_at,
        }));

        setAllBadges(allBadgesWithStatus);
      }
    } catch (error) {
      console.error("Error loading all badges:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "epic":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {badges.slice(0, 3).map((badge) => (
          <BadgeUI
            key={badge.id}
            variant="secondary"
            className={`${getRarityColor(badge.rarity)} text-white cursor-pointer`}
            onClick={() => isOwnProfile && setShowDialog(true)}
          >
            <span className="mr-1">{badge.icon}</span>
            {badge.name}
          </BadgeUI>
        ))}
        {badges.length > 3 && (
          <BadgeUI
            variant="outline"
            className="cursor-pointer"
            onClick={() => setShowDialog(true)}
          >
            +{badges.length - 3} Daha
          </BadgeUI>
        )}
        {isOwnProfile && badges.length === 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowDialog(true)}>
            <Award className="w-4 h-4 mr-2" />
            Rozetleri Görüntüle
          </Button>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isOwnProfile ? "Rozetlerim" : `${userId}'nin Rozetleri`}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-96">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {(isOwnProfile ? allBadges : badges).map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    badge.earned_at
                      ? `${getRarityColor(badge.rarity)} border-transparent`
                      : "bg-muted border-dashed border-muted-foreground/30 opacity-50"
                  }`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4
                    className={`font-semibold text-sm mb-1 ${
                      badge.earned_at ? "text-white" : ""
                    }`}
                  >
                    {badge.name}
                  </h4>
                  <p
                    className={`text-xs ${
                      badge.earned_at ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {badge.description}
                  </p>
                  {badge.earned_at && (
                    <p className="text-xs text-white/60 mt-2">
                      {new Date(badge.earned_at).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};