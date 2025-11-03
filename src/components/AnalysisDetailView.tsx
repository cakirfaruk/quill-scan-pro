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
        {result.overall && (
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
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {result.overall}
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
                    <div className="flex-1">
                      <Badge className="mb-2 bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                        {card.position || `Kart ${index + 1}`}
                      </Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-2">
                        {card.interpretation}
                      </p>
                    </div>
                  </div>
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {card.keywords.map((keyword: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
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
          <Card className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              💡 Tavsiyeler
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.advice}</p>
          </Card>
        )}

        {result.warnings && (
          <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600" />
              ⚠️ Dikkat Edilmesi Gerekenler
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.warnings}</p>
          </Card>
        )}
      </div>
    );
  }

  // Coffee Fortune
  if (analysisType === "coffee_fortune") {
    return (
      <div className="space-y-6">
        {result.overall && (
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
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.love && (
          <Card className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              💕 Aşk ve İlişkiler
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.love}</p>
          </Card>
        )}

        {result.career && (
          <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              💼 Kariyer
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.career}</p>
          </Card>
        )}

        {result.finance && (
          <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              💰 Finans
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.finance}</p>
          </Card>
        )}

        {result.health && (
          <Card className="p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              🏥 Sağlık
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.health}</p>
          </Card>
        )}

        {result.future && (
          <Card className="p-5 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              🔮 Gelecek
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.future}</p>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="p-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              🔍 Görülen Semboller
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {result.symbols.map((symbol: any, index: number) => (
                <div key={index} className="p-3 bg-background rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="font-semibold text-amber-900 dark:text-amber-100">{symbol.name}</div>
                  {symbol.location && (
                    <div className="text-xs text-muted-foreground mt-1">{symbol.location}</div>
                  )}
                  <div className="text-sm text-foreground mt-2">{symbol.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Dream Interpretation
  if (analysisType === "dream") {
    return (
      <div className="space-y-6">
        {result.overall && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  Genel Özet
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="p-5 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              🔮 Rüyadaki Semboller
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {result.symbols.map((symbol: any, index: number) => (
                <div key={index} className="p-3 bg-background rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="font-semibold text-purple-900 dark:text-purple-100">{symbol.symbol}</div>
                  <div className="text-sm text-foreground mt-2">{symbol.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {result.psychological && (
          <Card className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              🧠 Psikolojik Yorum
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.psychological}</p>
          </Card>
        )}

        {result.spiritual && (
          <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-600" />
              ✨ Manevi Yorum
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.spiritual}</p>
          </Card>
        )}

        {result.future_signs && (
          <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              🔮 Gelecek İşaretleri
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.future_signs}</p>
          </Card>
        )}

        {result.advice && (
          <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              💡 Tavsiyeler
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.advice}</p>
          </Card>
        )}

        {result.warnings && (
          <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-600" />
              ⚠️ Uyarılar
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.warnings}</p>
          </Card>
        )}
      </div>
    );
  }

  // Palmistry
  if (analysisType === "palmistry") {
    return (
      <div className="space-y-6">
        {result.overall && (
          <Card className="p-6 bg-gradient-to-br from-teal-50 via-background to-background dark:from-teal-900/20 border-2 border-teal-200 dark:border-teal-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-teal-600 to-teal-800 rounded-full">
                  <Hand className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  Genel Özet
                </h3>
              </div>
              <p className="text-base leading-relaxed text-foreground pl-12 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.life_line && (
          <Card className="p-5 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              ❤️ Hayat Çizgisi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.life_line}</p>
          </Card>
        )}

        {result.head_line && (
          <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              🧠 Akıl Çizgisi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.head_line}</p>
          </Card>
        )}

        {result.heart_line && (
          <Card className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              💕 Kalp Çizgisi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.heart_line}</p>
          </Card>
        )}

        {result.fate_line && (
          <Card className="p-5 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              🌟 Kader Çizgisi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.fate_line}</p>
          </Card>
        )}

        {result.personality && (
          <Card className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border-teal-200 dark:border-teal-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              🎭 Kişilik Analizi
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.personality}</p>
          </Card>
        )}

        {result.career && (
          <Card className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              💼 Kariyer ve Yetenek
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.career}</p>
          </Card>
        )}

        {result.relationships && (
          <Card className="p-5 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 border-rose-200 dark:border-rose-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              💑 İlişkiler
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.relationships}</p>
          </Card>
        )}

        {result.health && (
          <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              🏥 Sağlık
            </h4>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.health}</p>
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
                {Object.entries(planetarySigns).map(([planet, data]: [string, any]) => (
                  <div key={planet} className="flex flex-col p-3 bg-background rounded-lg border border-purple-200 dark:border-purple-800">
                    <span className="font-semibold text-purple-900 dark:text-purple-100 mb-1 capitalize">{planet}:</span>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                        {data.burc}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{data.derece}</span>
                    </div>
                  </div>
                ))}
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
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // For other analysis types (handwriting, numerology) - use generic display
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