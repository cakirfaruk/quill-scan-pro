import { motion } from "framer-motion";
import { Sun, Heart, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OracleQuickActionsProps {
  onAction: (action: string) => void;
  compact?: boolean;
}

const actions = [
  {
    id: "daily_energy",
    label: "Günlük Enerji",
    icon: Sun,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "love_advice",
    label: "Aşk Tavsiyesi",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "career_guidance",
    label: "Kariyer Rehberliği",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "draw_card",
    label: "Kart Çek",
    icon: Sparkles,
    color: "from-purple-500 to-violet-500",
  },
];

export const OracleQuickActions = ({ onAction, compact }: OracleQuickActionsProps) => {
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => onAction(action.id)}
            className="shrink-0 gap-1.5 text-xs"
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onAction(action.id)}
          className={cn(
            "relative group p-4 rounded-xl bg-card border border-border/50",
            "hover:border-purple-500/30 transition-all duration-300",
            "flex flex-col items-center gap-2"
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center",
              "group-hover:scale-110 transition-transform duration-300",
              action.color
            )}
          >
            <action.icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-medium">{action.label}</span>
          
          {/* Glow effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
              "bg-gradient-to-br transition-opacity duration-300 -z-10 blur-xl",
              action.color
            )}
            style={{ opacity: 0.1 }}
          />
        </motion.button>
      ))}
    </div>
  );
};
