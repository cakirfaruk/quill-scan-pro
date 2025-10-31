import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, User } from "lucide-react";

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
