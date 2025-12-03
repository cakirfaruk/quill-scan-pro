import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OracleDailyLimitProps {
  remaining: number;
}

export const OracleDailyLimit = ({ remaining }: OracleDailyLimitProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
        remaining > 0
          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{remaining}/3</span>
    </div>
  );
};
