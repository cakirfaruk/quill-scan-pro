import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, SkeletonAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  stats?: {
    label: string;
    value: number | string;
  }[];
  badges?: string[];
  onClick?: () => void;
  withHover?: boolean;
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      className,
      username,
      fullName,
      bio,
      avatarUrl,
      isOnline,
      stats,
      badges,
      onClick,
      withHover = true,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        whileHover={withHover ? { scale: 1.02, y: -4 } : {}}
        whileTap={withHover ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        <Card
          ref={ref}
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            "hover:shadow-elegant hover:border-primary/30",
            onClick && "cursor-pointer",
            className
          )}
          onClick={onClick}
          {...props}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* Avatar with online status */}
              <div className="relative">
                <Avatar withGlow withRing className="h-16 w-16">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background"
                  >
                    <div className="h-full w-full rounded-full bg-green-500 animate-ping opacity-75" />
                  </motion.div>
                )}
              </div>

              {/* Profile info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {fullName || username}
                </h3>
                <p className="text-sm text-muted-foreground truncate">@{username}</p>

                {bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{bio}</p>
                )}

                {/* Badges */}
                {badges && badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {badges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-lg font-semibold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }
);
ProfileCard.displayName = "ProfileCard";

// Skeleton Profile Card
interface SkeletonProfileCardProps {
  className?: string;
  withStats?: boolean;
}

const SkeletonProfileCard = ({ className, withStats = true }: SkeletonProfileCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-muted rounded animate-pulse mt-3" />
            <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {withStats && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-1">
                <div className="h-6 w-12 mx-auto bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 mx-auto bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 shimmer-effect" />
    </Card>
  );
};

export { ProfileCard, SkeletonProfileCard };
