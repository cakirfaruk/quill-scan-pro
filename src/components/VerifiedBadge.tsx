import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge = ({ size = "md", className, showTooltip = true }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const badge = (
    <BadgeCheck
      className={cn(
        "text-blue-500 fill-blue-500/20",
        sizeClasses[size],
        className
      )}
    />
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Doğrulanmış Profil</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
