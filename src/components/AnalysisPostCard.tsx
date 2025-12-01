import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Coffee, Moon, Hand, Star, Heart, User, 
  Zap, TrendingUp, ChevronRight, Eye 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnalysisPostCardProps {
  analysisType: string;
  analysisData: any;
}

export const AnalysisPostCard = memo(({ analysisType, analysisData }: AnalysisPostCardProps) => {
  const navigate = useNavigate();

  // Icon and color mapping
  const getAnalysisConfig = (type: string) => {
    const configs: Record<string, { icon: any; color: string; gradient: string; title: string }> = {
      tarot: {
        icon: Sparkles,
        color: "purple",
        gradient: "from-purple-500 to-purple-700",
        title: "Tarot Falı",
      },
      coffee_fortune: {
        icon: Coffee,
        color: "amber",
        gradient: "from-amber-500 to-amber-700",
        title: "Kahve Falı",
      },
      dream: {
        icon: Moon,
        color: "indigo",
        gradient: "from-indigo-500 to-indigo-700",
        title: "Rüya Tabiri",
      },
      palmistry: {
        icon: Hand,
        color: "emerald",
        gradient: "from-emerald-500 to-emerald-700",
        title: "El Falı",
      },
      numerology: {
        icon: TrendingUp,
        color: "blue",
        gradient: "from-blue-500 to-blue-700",
        title: "Numeroloji",
      },
      birth_chart: {
        icon: Star,
        color: "pink",
        gradient: "from-pink-500 to-pink-700",
        title: "Doğum Haritası",
      },
      compatibility: {
        icon: Heart,
        color: "rose",
        gradient: "from-rose-500 to-rose-700",
        title: "Uyumluluk Analizi",
      },
      horoscope: {
        icon: Zap,
        color: "violet",
        gradient: "from-violet-500 to-violet-700",
        title: "Burç Yorumu",
      },
    };
    return configs[type] || configs.tarot;
  };

  const config = getAnalysisConfig(analysisType);
  const Icon = config.icon;

  // Extract summary from analysis data
  const getSummary = () => {
    if (analysisData?.overall) {
      return analysisData.overall.slice(0, 200) + (analysisData.overall.length > 200 ? "..." : "");
    }
    if (analysisData?.overallSummary) {
      return analysisData.overallSummary.slice(0, 200) + (analysisData.overallSummary.length > 200 ? "..." : "");
    }
    if (analysisData?.summary) {
      return analysisData.summary.slice(0, 200) + (analysisData.summary.length > 200 ? "..." : "");
    }
    return "Analiz sonuçlarını görmek için tıklayın";
  };

  // Extract key insights
  const getKeyInsights = () => {
    const insights: string[] = [];
    
    if (analysisType === "tarot" && analysisData?.cards) {
      insights.push(`${analysisData.cards.length} kart açıldı`);
    }
    
    if (analysisType === "numerology" && analysisData?.lifePathNumber) {
      insights.push(`Yaşam Yolu: ${analysisData.lifePathNumber}`);
    }
    
    if (analysisType === "compatibility" && analysisData?.overallScore) {
      insights.push(`Uyumluluk: %${analysisData.overallScore}`);
    }

    if (analysisType === "birth_chart" && analysisData?.sunSign) {
      insights.push(`Güneş: ${analysisData.sunSign}`);
    }

    return insights;
  };

  const summary = getSummary();
  const insights = getKeyInsights();

  return (
    <Card className={`overflow-hidden border-2 border-${config.color}-200 dark:border-${config.color}-800 hover:shadow-lg transition-all duration-300`}>
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${config.gradient} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <Badge className="mb-1 bg-white/20 text-white border-white/30">
              Analiz Sonucu
            </Badge>
            <h3 className="text-lg font-bold">{config.title}</h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Key Insights */}
        {insights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`text-${config.color}-700 border-${config.color}-300 bg-${config.color}-50 dark:bg-${config.color}-950 dark:border-${config.color}-700`}
              >
                {insight}
              </Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary}
        </p>

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full group"
          onClick={() => {
            // Navigate to appropriate analysis page
            const routes: Record<string, string> = {
              tarot: "/tarot",
              coffee_fortune: "/coffee-fortune",
              dream: "/dream-interpretation",
              palmistry: "/palmistry",
              numerology: "/numerology",
              birth_chart: "/birth-chart",
              compatibility: "/compatibility",
              horoscope: "/daily-horoscope",
            };
            navigate(routes[analysisType] || "/");
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Detayları Görüntüle
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
});

AnalysisPostCard.displayName = "AnalysisPostCard";
