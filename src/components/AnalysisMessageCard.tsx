import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coffee, Moon, Hand, Heart, Star, Zap } from "lucide-react";

interface AnalysisMessageCardProps {
  content: string;
  analysisType?: string;
  timestamp: string;
  isSender: boolean;
  onClick: () => void;
}

const analysisTypeConfig: Record<string, {
  icon: any;
  label: string;
  emoji: string;
  gradient: string;
  borderColor: string;
}> = {
  tarot: {
    icon: Sparkles,
    label: "Tarot Falı",
    emoji: "🔮",
    gradient: "from-purple-500/10 to-violet-500/10 dark:from-purple-900/20 dark:to-violet-900/20",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  coffee_fortune: {
    icon: Coffee,
    label: "Kahve Falı",
    emoji: "☕",
    gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  dream: {
    icon: Moon,
    label: "Rüya Tabiri",
    emoji: "🌙",
    gradient: "from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20",
    borderColor: "border-indigo-300 dark:border-indigo-700",
  },
  palmistry: {
    icon: Hand,
    label: "El Okuma",
    emoji: "✋",
    gradient: "from-teal-500/10 to-cyan-500/10 dark:from-teal-900/20 dark:to-cyan-900/20",
    borderColor: "border-teal-300 dark:border-teal-700",
  },
  compatibility: {
    icon: Heart,
    label: "Uyumluluk Analizi",
    emoji: "💕",
    gradient: "from-pink-500/10 to-rose-500/10 dark:from-pink-900/20 dark:to-rose-900/20",
    borderColor: "border-pink-300 dark:border-pink-700",
  },
  birth_chart: {
    icon: Star,
    label: "Doğum Haritası",
    emoji: "⭐",
    gradient: "from-yellow-500/10 to-orange-500/10 dark:from-yellow-900/20 dark:to-orange-900/20",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  daily_horoscope: {
    icon: Star,
    label: "Günlük Burç",
    emoji: "🌟",
    gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-900/20 dark:to-purple-900/20",
    borderColor: "border-violet-300 dark:border-violet-700",
  },
  numerology: {
    icon: Zap,
    label: "Numeroloji",
    emoji: "🔢",
    gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-900/20 dark:to-cyan-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
};

export const AnalysisMessageCard = ({ 
  content, 
  analysisType, 
  timestamp,
  isSender,
  onClick 
}: AnalysisMessageCardProps) => {
  // Extract the main content before analysis metadata
  const mainContent = content.split('[Analiz ID:')[0].trim();
  
  // Try to extract title from content
  const titleMatch = mainContent.match(/^📊\s*\*\*(.+?)\*\*/);
  const title = titleMatch ? titleMatch[1] : "Analiz Sonucu";
  
  // Extract summary (everything after title)
  const summary = titleMatch 
    ? mainContent.replace(/^📊\s*\*\*.+?\*\*\n\n/, '').substring(0, 120) + (mainContent.length > 140 ? '...' : '')
    : mainContent.substring(0, 120) + (mainContent.length > 120 ? '...' : '');

  const config = analysisType && analysisTypeConfig[analysisType]
    ? analysisTypeConfig[analysisType]
    : {
        icon: Sparkles,
        label: "Analiz Sonucu",
        emoji: "📊",
        gradient: "from-primary/10 to-accent/10",
        borderColor: "border-primary/30",
      };

  const Icon = config.icon;

  return (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]
        bg-gradient-to-br ${config.gradient}
        border-2 ${config.borderColor}
        max-w-sm
      `}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`
            p-2.5 rounded-xl
            bg-gradient-to-br from-white/80 to-white/60 
            dark:from-white/10 dark:to-white/5
            shadow-sm
          `}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.emoji}</span>
              <Badge variant="secondary" className="text-xs font-medium">
                {config.label}
              </Badge>
            </div>
            <h4 className="font-semibold text-sm text-foreground line-clamp-1">
              {title}
            </h4>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pl-1">
            {summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
            <span>Detayları Gör</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Card>
  );
};
