import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, User, Sparkles, Moon, Hand, Coffee, Star, Zap } from "lucide-react";

interface CompatibilityArea {
  name: string;
  person1Finding: string;
  person2Finding: string;
  compatibilityScore: number;
  strengths: string;
  challenges: string;
  recommendations: string;
}

interface AnalysisDetailViewProps {
  result: any;
  analysisType: string;
}

export const AnalysisDetailView = ({ result, analysisType }: AnalysisDetailViewProps) => {
  // Tarot Reading
  if (analysisType === "tarot") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 via-background to-background dark:from-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  Genel Yorum
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        {result.cards && result.cards.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Kart Yorumları
            </h3>
            {result.cards.map((card: any, index: number) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-purple-600">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-2 bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                        {card.position || `Kart ${index + 1}`}
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">{card.name}</h4>
                    </div>
                    {card.reversed && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Ters
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.meaning}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Coffee Fortune
  if (analysisType === "coffee_fortune") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="p-6 bg-gradient-to-br from-amber-50 via-background to-background dark:from-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  Genel Yorum
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        {result.areas && result.areas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Detaylı Yorumlar
            </h3>
            {result.areas.map((area: any, index: number) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-amber-600">
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {area.icon && <span>{area.icon}</span>}
                    {area.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{area.interpretation}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Dream Interpretation
  if (analysisType === "dream") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  Genel Yorum
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Semboller ve Anlamları
            </h3>
            {result.symbols.map((symbol: any, index: number) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-indigo-600">
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-foreground">{symbol.symbol}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{symbol.meaning}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {result.advice && (
          <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-600" />
              Öneri
            </h4>
            <p className="text-sm text-foreground/80">{result.advice}</p>
          </Card>
        )}
      </div>
    );
  }

  // Palmistry
  if (analysisType === "palmistry") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="p-6 bg-gradient-to-br from-teal-50 via-background to-background dark:from-teal-900/20 border-2 border-teal-200 dark:border-teal-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-teal-600 to-teal-800 rounded-full">
                  <Hand className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  Genel Değerlendirme
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        {result.lines && result.lines.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Çizgi Yorumları
            </h3>
            {result.lines.map((line: any, index: number) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-teal-600">
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-foreground">{line.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{line.interpretation}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {result.personality && (
          <Card className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border-teal-200 dark:border-teal-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Kişilik Analizi
            </h4>
            <p className="text-sm text-foreground/80">{result.personality}</p>
          </Card>
        )}
      </div>
    );
  }

  // Daily Horoscope
  if (analysisType === "daily_horoscope") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="p-6 bg-gradient-to-br from-violet-50 via-background to-background dark:from-violet-900/20 border-2 border-violet-200 dark:border-violet-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-violet-800 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                  Bugünkü Enerjiniz
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        {result.areas && result.areas.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {result.areas.map((area: any, index: number) => (
              <Card key={index} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-violet-600">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    {area.icon && <span>{area.icon}</span>}
                    {area.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{area.text}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {(result.luckyNumber || result.luckyColor) && (
          <Card className="p-5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border-violet-200 dark:border-violet-800">
            <div className="flex items-center justify-around">
              {result.luckyNumber && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Şanslı Sayı</p>
                  <p className="text-3xl font-bold text-violet-600">{result.luckyNumber}</p>
                </div>
              )}
              {result.luckyColor && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Şanslı Renk</p>
                  <p className="text-xl font-bold text-violet-600">{result.luckyColor}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Compatibility Analysis
  if (analysisType === "compatibility") {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-2 border-primary/20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-full">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">
                %{result.overallScore} Uyum
              </h3>
              <Progress value={result.overallScore} className="h-3 mt-4" />
            </div>
            <p className="text-base leading-relaxed text-foreground">
              {result.overallSummary}
            </p>
          </div>
        </Card>

        {result.person1Analysis && result.person2Analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Birinci Kişi
              </h4>
              <p className="text-sm text-muted-foreground">{result.person1Analysis}</p>
            </Card>
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                İkinci Kişi
              </h4>
              <p className="text-sm text-muted-foreground">{result.person2Analysis}</p>
            </Card>
          </div>
        )}

        {result.compatibilityAreas && result.compatibilityAreas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Uyum Alanları</h3>
            {result.compatibilityAreas.map((area: CompatibilityArea, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-foreground">{area.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">%{area.compatibilityScore}</span>
                    <Progress value={area.compatibilityScore} className="w-20 h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Birinci Kişi
                    </p>
                    <p className="text-sm text-foreground/80">{area.person1Finding}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      İkinci Kişi
                    </p>
                    <p className="text-sm text-foreground/80">{area.person2Finding}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-success uppercase mb-1">Güçlü Yanlar</p>
                    <p className="text-sm text-foreground">{area.strengths}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-warning uppercase mb-1">Zorluklar</p>
                    <p className="text-sm text-foreground">{area.challenges}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase mb-1">Öneriler</p>
                    <p className="text-sm text-foreground">{area.recommendations}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // For other analysis types (handwriting, numerology, birth_chart)
  const renderAnalysisSection = (data: any, depth: number = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        elements.push(
          <div key={key} className={depth === 0 ? "mb-6" : "mb-4"}>
            <h3 className={`font-bold mb-3 ${depth === 0 ? "text-xl text-primary" : "text-base text-foreground"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
            </h3>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              {renderAnalysisSection(value, depth + 1)}
            </div>
          </div>
        );
      } else if (Array.isArray(value)) {
        elements.push(
          <div key={key} className="mb-3">
            <p className="font-semibold text-foreground mb-2">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}:
            </p>
            <div className="space-y-1 pl-4">
              {value.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1 shrink-0">
                    {idx + 1}
                  </Badge>
                  <p className="text-sm text-muted-foreground flex-1">
                    {typeof item === "object" ? JSON.stringify(item) : String(item)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={key} className="mb-3">
            <p className="font-semibold text-foreground mb-1">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}:
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed pl-4">
              {String(value)}
            </p>
          </div>
        );
      }
    });
    
    return elements;
  };

  return (
    <div className="space-y-4">
      {renderAnalysisSection(result)}
    </div>
  );
};
