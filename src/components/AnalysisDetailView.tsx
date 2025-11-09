import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, User, Sparkles, Moon, Hand, Coffee, Star, Zap, FileText } from "lucide-react";
import { ShareResultButton } from "@/components/ShareResultButton";

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
  // Helper function to format content for sharing
  const formatShareContent = (section: string, content: string) => {
    return `${section}\n\n${content}`;
  };

  // Tarot Reading
  if (analysisType === "tarot") {
    return (
      <div className="space-y-3 sm:space-y-4">
        {result.overall && (
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 via-background to-background dark:from-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100">
                  Özet
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.cards && result.cards.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
              Kartlar
            </h3>
            {result.cards.map((card: any, index: number) => (
              <Card key={index} className="p-2.5 sm:p-3 border-l-2 border-l-purple-600">
                <div className="space-y-1.5">
                  <Badge className="text-xs bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                    {card.position || `${index + 1}`}
                  </Badge>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {card.interpretation}
                  </p>
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.keywords.slice(0, 3).map((keyword: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {result.advice && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-blue-600" />
              Tavsiye
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.advice}</p>
            <div className="mt-2 pt-2 border-t border-border">
              <ShareResultButton
                title="Tarot Falı - Tavsiye"
                content={formatShareContent("Tavsiye", result.advice)}
                size="sm"
                variant="ghost"
                className="w-full"
              />
            </div>
          </Card>
        )}

        {result.warnings && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-orange-600" />
              Dikkat
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.warnings}</p>
          </Card>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm tarot falı sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="Tarot Falı - Tam Rapor"
            content={`${result.overall || ''}\n\n${result.cards ? result.cards.map((c: any) => `${c.position}: ${c.interpretation}`).join('\n\n') : ''}`}
            result={result}
            analysisType="tarot"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // Coffee Fortune
  if (analysisType === "coffee_fortune") {
    return (
      <div className="space-y-3 sm:space-y-4">
        {result.overall && (
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 via-background to-background dark:from-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex-shrink-0">
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-100">
                  Özet
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.love && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-600" />
              Aşk
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.love}</p>
            <div className="mt-2 pt-2 border-t border-border">
              <ShareResultButton
                title="Kahve Falı - Aşk"
                content={formatShareContent("Aşk", result.love)}
                size="sm"
                variant="ghost"
                className="w-full"
              />
            </div>
          </Card>
        )}

        {result.career && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Kariyer
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.career}</p>
          </Card>
        )}

        {result.finance && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              Finans
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.finance}</p>
          </Card>
        )}

        {result.health && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              Sağlık
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.health}</p>
          </Card>
        )}

        {result.future && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-purple-600" />
              Gelecek
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.future}</p>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              Semboller
            </h4>
            <div className="grid gap-2">
              {result.symbols.slice(0, 3).map((symbol: any, index: number) => (
                <div key={index} className="p-2 bg-background rounded border border-amber-200 dark:border-amber-800">
                  <div className="text-xs font-semibold text-amber-900 dark:text-amber-100">{symbol.name}</div>
                  <div className="text-xs text-foreground mt-1">{symbol.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm kahve falı sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="Kahve Falı - Tam Rapor"
            content={`${result.overall || ''}`}
            result={result}
            analysisType="coffee_fortune"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // Dream Interpretation
  if (analysisType === "dream") {
    return (
      <div className="space-y-3 sm:space-y-4">
        {result.overall && (
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex-shrink-0">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-100">
                  Özet
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="p-2.5 sm:p-3 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Semboller
            </h4>
            <div className="grid gap-2">
              {result.symbols.slice(0, 3).map((symbol: any, index: number) => (
                <div key={index} className="p-2 bg-background rounded border border-purple-200 dark:border-purple-800">
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-100">{symbol.symbol}</div>
                  <div className="text-xs text-foreground mt-1">{symbol.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {result.psychological && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Psikolojik
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.psychological}</p>
            <div className="mt-2 pt-2 border-t border-border">
              <ShareResultButton
                title="Rüya Tabiri - Psikolojik"
                content={formatShareContent("Psikolojik", result.psychological)}
                size="sm"
                variant="ghost"
                className="w-full"
              />
            </div>
          </Card>
        )}

        {result.spiritual && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-indigo-600" />
              Manevi
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.spiritual}</p>
          </Card>
        )}

        {result.future_signs && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-purple-600" />
              Gelecek
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.future_signs}</p>
          </Card>
        )}

        {result.advice && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-green-600" />
              Tavsiye
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.advice}</p>
          </Card>
        )}

        {result.warnings && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-orange-600" />
              Uyarı
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.warnings}</p>
          </Card>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-indigo-300 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm rüya yorumunuzu PDF olarak indirin</p>
          <ShareResultButton
            title="Rüya Tabiri - Tam Rapor"
            content={`${result.overall || ''}`}
            result={result}
            analysisType="dream"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // Palmistry
  if (analysisType === "palmistry") {
    return (
      <div className="space-y-3 sm:space-y-4">
        {result.overall && (
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-teal-50 via-background to-background dark:from-teal-900/20 border border-teal-200 dark:border-teal-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-600 to-teal-800 rounded-full flex-shrink-0">
                  <Hand className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-teal-900 dark:text-teal-100">
                  Özet
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.life_line && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border-red-200 dark:border-red-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-600" />
              Hayat
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.life_line}</p>
            <div className="mt-2 pt-2 border-t border-border">
              <ShareResultButton
                title="El Okuma - Hayat Çizgisi"
                content={formatShareContent("Hayat Çizgisi", result.life_line)}
                size="sm"
                variant="ghost"
                className="w-full"
              />
            </div>
          </Card>
        )}

        {result.head_line && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Akıl
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.head_line}</p>
          </Card>
        )}

        {result.heart_line && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-600" />
              Kalp
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.heart_line}</p>
          </Card>
        )}

        {result.fate_line && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-purple-600" />
              Kader
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.fate_line}</p>
          </Card>
        )}

        {result.personality && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border-teal-200 dark:border-teal-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Kişilik
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.personality}</p>
          </Card>
        )}

        {result.career && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Kariyer
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.career}</p>
          </Card>
        )}

        {result.relationships && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 border-rose-200 dark:border-rose-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              İlişkiler
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.relationships}</p>
          </Card>
        )}

        {result.health && (
          <Card className="p-2.5 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              Sağlık
            </h4>
            <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap">{result.health}</p>
          </Card>
        )}

        {result.future && (
          <Card className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600" />
              🔮 Gelecek İşaretleri
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.future}</p>
          </Card>
        )}

        {result.special_marks && result.special_marks.length > 0 && (
          <Card className="p-5 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-violet-600" />
              ✨ Özel İşaretler
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {result.special_marks.map((mark: any, index: number) => (
                <div key={index} className="p-3 bg-background rounded-lg border border-violet-200 dark:border-violet-800">
                  <div className="font-semibold text-violet-900 dark:text-violet-100">{mark.mark}</div>
                  {mark.location && (
                    <div className="text-xs text-muted-foreground mt-1">{mark.location}</div>
                  )}
                  <div className="text-sm text-foreground mt-2">{mark.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-teal-300 dark:border-teal-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm el okuma sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="El Okuma - Tam Rapor"
            content={`${result.overall || ''}`}
            result={result}
            analysisType="palmistry"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
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
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {result.love && (
            <Card className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-800">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Aşk ve İlişkiler
              </h4>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.love}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <ShareResultButton
                  title="Günlük Burç - Aşk ve İlişkiler"
                  content={formatShareContent("Aşk ve İlişkiler", result.love)}
                  size="sm"
                  variant="ghost"
                  className="w-full"
                />
              </div>
            </Card>
          )}

          {result.career && (
            <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Kariyer
              </h4>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.career}</p>
            </Card>
          )}

          {result.money && (
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Para
              </h4>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.money}</p>
            </Card>
          )}

          {result.health && (
            <Card className="p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" />
                Sağlık
              </h4>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.health}</p>
            </Card>
          )}
        </div>

        {(result.lucky_number || result.lucky_color) && (
          <Card className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600" />
              🍀 Şanslı Öğeler
            </h4>
            <div className="flex items-center justify-around">
              {result.lucky_number && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Şanslı Sayı</p>
                  <p className="text-3xl font-bold text-violet-600">{result.lucky_number}</p>
                </div>
              )}
              {result.lucky_color && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Şanslı Renk</p>
                  <p className="text-xl font-bold text-violet-600">{result.lucky_color}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {result.advice && (
          <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-600" />
              💡 Günün Tavsiyesi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.advice}</p>
          </Card>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-violet-300 dark:border-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Günlük burç yorumunuzu PDF olarak indirin</p>
          <ShareResultButton
            title="Günlük Burç - Tam Rapor"
            content={`${result.general || result.daily_energy || ''}`}
            result={result}
            analysisType="daily_horoscope"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
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
                  <div className="pt-2">
                    <ShareResultButton
                      title={`Uyumluluk - ${area.name}`}
                      content={`${area.name}\n\nUyum: %${area.compatibilityScore}\n\nGüçlü Yanlar: ${area.strengths}\n\nZorluklar: ${area.challenges}\n\nÖneriler: ${area.recommendations}`}
                      size="sm"
                      variant="ghost"
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-pink-300 dark:border-pink-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-pink-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm uyumluluk analizi sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="Uyumluluk Analizi - Tam Rapor"
            content={`${result.overallSummary || result.overall_summary || ''}`}
            result={result}
            analysisType="compatibility"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // Birth Chart
  if (analysisType === "birth_chart") {
    const topics = result.seçilen_konular || result.secilen_konular || {};
    const generalEvaluation = result.genel_degerlendirme || "";
    const astronomicData = result.astronomik_veriler || {};
    const planetarySigns = astronomicData.gezegen_burclari || {};

    return (
      <div className="space-y-6">
        {Object.keys(planetarySigns).length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 via-background to-background dark:from-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  Gezegen Konumları
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                {Object.entries(planetarySigns).map(([planet, data]: [string, any]) => {
                  const planetNames: Record<string, string> = {
                    gunes: "Güneş",
                    ay: "Ay",
                    merkur: "Merkür",
                    venus: "Venüs",
                    mars: "Mars",
                    jupiter: "Jüpiter",
                    saturn: "Satürn",
                    uranus: "Uranüs",
                    neptun: "Neptün",
                    pluton: "Plüton",
                    chiron: "Chiron",
                  };
                  
                  return (
                    <div key={planet} className="flex flex-col p-3 bg-background rounded-lg border border-purple-200 dark:border-purple-800">
                      <span className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        {planetNames[planet] || planet}:
                      </span>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                          {data.burc}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{data.derece}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {generalEvaluation && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  Genel Değerlendirme
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {generalEvaluation}
              </p>
            </div>
          </Card>
        )}

        {Object.entries(topics).map(([topicName, topicData]: [string, any]) => (
          <Card key={topicName} className="p-6 border-2 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {topicName}
            </h3>
            <div className="space-y-4">
              {topicData.genel_bakis && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Genel Bakış</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.genel_bakis}
                  </p>
                </div>
              )}
              {topicData.ozellikler && topicData.ozellikler.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Özellikler</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                    {topicData.ozellikler.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {topicData.guclu_yonler && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✨ Güçlü Yönler</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.guclu_yonler}
                  </p>
                </div>
              )}
              {topicData.dikkat_edilmesi_gerekenler && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">⚠️ Dikkat Edilmesi Gerekenler</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.dikkat_edilmesi_gerekenler}
                  </p>
                </div>
              )}
              {topicData.tavsiyeler && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tavsiyeler</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.tavsiyeler}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <ShareResultButton
                      title={`Doğum Haritası - ${topicName}`}
                      content={`${topicName}\n\n${topicData.genel_bakis || ''}\n\nTavsiyeler: ${topicData.tavsiyeler}`}
                      size="sm"
                      variant="ghost"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {/* Full PDF Download Button */}
        <Card className="p-3 sm:p-4 border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm doğum haritası analizi sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="Doğum Haritası - Tam Rapor"
            content={`${result.genel_degerlendirme || result.general_evaluation || ''}`}
            result={result}
            analysisType="birth_chart"
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // Numerology Analysis
  if (analysisType === "numerology") {
    const topicIcons: Record<string, any> = {
      "Kader Rakamı": { icon: Star, color: "blue" },
      "İsim Analizi": { icon: Sparkles, color: "purple" },
      "Doğum Tarihi Analizi": { icon: Sparkles, color: "green" },
      "Yaşam Döngüleri": { icon: Zap, color: "orange" },
      "Ruh Arzusu Rakamı": { icon: Heart, color: "pink" },
      "Kişisel Rakam": { icon: User, color: "indigo" },
      "Olgunluk Rakamı": { icon: Sparkles, color: "teal" },
      "Köprü Rakamları": { icon: Zap, color: "amber" },
      "Kişilik Rakamı": { icon: User, color: "cyan" },
      "Güçlü ve Zayıf Yönler": { icon: Sparkles, color: "rose" },
      "Kariyer ve Yetenekler": { icon: Zap, color: "violet" },
      "İlişkiler ve Uyum": { icon: Heart, color: "red" },
      "Sağlık ve Yaşam Enerjisi": { icon: Heart, color: "emerald" },
    };

    const colorGradients: Record<string, string> = {
      blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800",
      purple: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800",
      green: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800",
      orange: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800",
      pink: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800",
      indigo: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800",
      teal: "from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800",
      amber: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800",
      cyan: "from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800",
      rose: "from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-800",
      violet: "from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-800",
      red: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800",
      emerald: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800",
    };

    return (
      <div className="space-y-3 sm:space-y-4">
        {result.overall_summary && (
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 via-background to-background dark:from-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-100">
                  Genel Değerlendirme
                </h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {result.overall_summary}
              </p>
            </div>
          </Card>
        )}

        {result.topics && Object.entries(result.topics).map(([topicName, topicData]: [string, any]) => {
          const topicConfig = topicIcons[topicName] || { icon: Sparkles, color: "blue" };
          const Icon = topicConfig.icon;
          const gradient = colorGradients[topicConfig.color];

          // Helper function to get explanation (supports both old and new format)
          const getExplanation = (data: any): string => {
            if (!data) return "";
            
            // New format: single explanation field
            if (data.explanation) {
              return data.explanation;
            }
            
            // Old format: combine multiple fields for backward compatibility
            const parts: string[] = [];
            if (data.calculation) parts.push(data.calculation);
            if (data.meaning) parts.push(data.meaning);
            if (data.personal_interpretation) parts.push(data.personal_interpretation);
            if (data.references) parts.push(data.references);
            
            return parts.join("\n\n");
          };

          const explanation = getExplanation(topicData);
          if (!explanation) return null;

          return (
            <Card key={topicName} className={`p-2.5 sm:p-3 bg-gradient-to-r ${gradient}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-full bg-gradient-to-br from-${topicConfig.color}-600 to-${topicConfig.color}-800`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                    {topicName}
                    {topicData.value && (
                      <span className="ml-2 text-primary font-bold">
                        {topicData.value}
                      </span>
                    )}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </p>
                <div className="pt-2 border-t border-border">
                  <ShareResultButton
                    title={`Numeroloji - ${topicName}`}
                    content={formatShareContent(topicName, explanation)}
                    size="sm"
                    variant="ghost"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          );
        })}
        
        {/* Full PDF Download Button with complete result */}
        <Card className="p-3 sm:p-4 border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm font-semibold text-foreground">Tam Rapor</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Tüm analiz sonuçlarınızı PDF olarak indirin</p>
          <ShareResultButton
            title="Numeroloji Analizi - Tam Rapor"
            content={`${result.overall_summary || ''}\n\n${result.topics ? Object.entries(result.topics).map(([name, data]: [string, any]) => `${name}: ${data.explanation || ''}`).join('\n\n') : ''}`}
            result={result}
            size="default"
            variant="default"
            className="w-full"
          />
        </Card>
      </div>
    );
  }

  // For other analysis types (handwriting) - use generic display
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
            <p className="text-sm text-muted-foreground leading-relaxed pl-4 whitespace-pre-wrap">
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