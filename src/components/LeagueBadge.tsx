import { cn } from "@/lib/utils";
import { Shield, Gem, Crown, Star, Award } from "lucide-react";

interface LeagueBadgeProps {
  league?: string;
  xp?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const getLeagueFromXP = (xp: number): string => {
  if (xp >= 50000) return 'diamond';
  if (xp >= 25000) return 'platinum';
  if (xp >= 10000) return 'gold';
  if (xp >= 3000) return 'silver';
  return 'bronze';
};

const leagueConfig = {
  bronze: {
    icon: Shield,
    label: 'Bronz',
    color: 'text-amber-700',
    bg: 'bg-amber-700/20',
    border: 'border-amber-700/30',
    gradient: 'from-amber-700 to-amber-800',
  },
  silver: {
    icon: Award,
    label: 'Gümüş',
    color: 'text-gray-400',
    bg: 'bg-gray-400/20',
    border: 'border-gray-400/30',
    gradient: 'from-gray-300 to-gray-500',
  },
  gold: {
    icon: Star,
    label: 'Altın',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  platinum: {
    icon: Crown,
    label: 'Platin',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/20',
    border: 'border-cyan-400/30',
    gradient: 'from-cyan-300 to-cyan-500',
  },
  diamond: {
    icon: Gem,
    label: 'Elmas',
    color: 'text-purple-400',
    bg: 'bg-purple-400/20',
    border: 'border-purple-400/30',
    gradient: 'from-purple-400 to-pink-500',
  },
};

export const LeagueBadge = ({ 
  league, 
  xp, 
  size = "md", 
  showLabel = false,
  className 
}: LeagueBadgeProps) => {
  const currentLeague = league || (xp !== undefined ? getLeagueFromXP(xp) : 'bronze');
  const config = leagueConfig[currentLeague as keyof typeof leagueConfig] || leagueConfig.bronze;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const containerSizes = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  if (showLabel) {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-1 rounded-full border",
          config.bg,
          config.border,
          containerSizes[size],
          "px-2",
          className
        )}
      >
        <Icon className={cn(sizeClasses[size], config.color)} />
        <span className={cn(textSizes[size], config.color, "font-medium")}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        config.bg,
        containerSizes[size],
        className
      )}
      title={config.label}
    >
      <Icon className={cn(sizeClasses[size], config.color)} />
    </div>
  );
};

export const LeagueProgress = ({ xp }: { xp: number }) => {
  const currentLeague = getLeagueFromXP(xp);
  const config = leagueConfig[currentLeague as keyof typeof leagueConfig];
  
  const thresholds = {
    bronze: { min: 0, max: 3000 },
    silver: { min: 3000, max: 10000 },
    gold: { min: 10000, max: 25000 },
    platinum: { min: 25000, max: 50000 },
    diamond: { min: 50000, max: 100000 },
  };

  const { min, max } = thresholds[currentLeague as keyof typeof thresholds];
  const progress = ((xp - min) / (max - min)) * 100;
  const nextLeague = currentLeague === 'diamond' ? null : 
    Object.keys(thresholds)[Object.keys(thresholds).indexOf(currentLeague) + 1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <LeagueBadge league={currentLeague} size="sm" showLabel />
        </div>
        {nextLeague && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs">{max - xp} XP</span>
            <LeagueBadge league={nextLeague} size="sm" />
          </div>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full bg-gradient-to-r transition-all duration-500", config.gradient)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};
