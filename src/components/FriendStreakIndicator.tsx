import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FriendStreakIndicatorProps {
  friendId: string;
  userId?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const FriendStreakIndicator = ({
  friendId,
  userId,
  size = "md",
  showLabel = false,
  className,
}: FriendStreakIndicatorProps) => {
  const [streak, setStreak] = useState<number>(0);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!userId || !friendId) return;
    loadStreak();
  }, [userId, friendId]);

  const loadStreak = async () => {
    try {
      const { data } = await supabase
        .from('friend_streaks')
        .select('current_streak, last_interaction_at')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle();

      if (data) {
        setStreak(data.current_streak);
        
        // Check if streak is about to expire (no interaction in 20+ hours)
        const lastInteraction = new Date(data.last_interaction_at);
        const hoursSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);
        setIsExpiring(hoursSince >= 20 && hoursSince < 48);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  if (streak === 0) return null;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStreakColor = () => {
    if (isExpiring) return "text-blue-400";
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-orange-500";
    if (streak >= 7) return "text-yellow-500";
    return "text-orange-400";
  };

  const getStreakEmoji = () => {
    if (streak >= 100) return "💯";
    if (streak >= 50) return "⚡";
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "✨";
    if (streak >= 7) return "🌟";
    return "";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-0.5 font-bold",
              sizeClasses[size],
              getStreakColor(),
              className
            )}
          >
            {isExpiring ? (
              <Snowflake className={cn(iconSizes[size], "animate-pulse")} />
            ) : (
              <Flame className={iconSizes[size]} />
            )}
            <span>{streak}</span>
            {showLabel && <span className="text-muted-foreground font-normal ml-1">gün</span>}
            {getStreakEmoji() && <span className="ml-0.5">{getStreakEmoji()}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {isExpiring 
              ? `${streak} günlük seri bitiyor! Mesaj gönderin.`
              : `${streak} günlük mesajlaşma serisi`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Compact version for conversation lists
export const StreakBadge = ({ streak, isExpiring }: { streak: number; isExpiring?: boolean }) => {
  if (streak === 0) return null;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-bold",
        isExpiring ? "text-blue-400" : "text-orange-400"
      )}
    >
      {isExpiring ? (
        <Snowflake className="w-3 h-3 animate-pulse" />
      ) : (
        <Flame className="w-3 h-3" />
      )}
      <span>{streak}</span>
    </div>
  );
};
