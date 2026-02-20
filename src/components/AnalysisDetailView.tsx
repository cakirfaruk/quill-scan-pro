
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
      <div className="space-y-4">
        {result.overall && (
          <Card className="glass-card p-4 border-violet-500/30 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-full flex-shrink-0 border border-violet-500/30">
                  <Sparkles className="w-5 h-5 text-violet-300" />
                </div>
                <h3 className="text-lg font-bold text-violet-200">
                  Özet
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.cards && result.cards.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              Kartlar
            </h3>
            {result.cards.map((card: any, index: number) => (
              <Card key={index} className="glass-card p-4 border-violet-500/20 text-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-500/20 text-violet-200 border-violet-500/30 hover:bg-violet-500/30">
                      {card.position || `${index + 1}`}
                    </Badge>
                    {card.name && <span className="font-semibold text-violet-300">{card.name}</span>}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                    {card.interpretation}
                  </p>
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.keywords.slice(0, 3).map((keyword: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/60">
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
          <Card className="glass-card p-4 border-blue-500/30 text-white">
            <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              Tavsiye
            </h4>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{result.advice}</p>
          </Card>
        )}

        {result.warnings && (
          <Card className="glass-card p-4 border-orange-500/30 text-white">
            <h4 className="text-sm font-semibold text-orange-200 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-400" />
              Dikkat
            </h4>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{result.warnings}</p>
          </Card>
        )}
      </div>
    );
  }

  // Coffee Fortune
  if (analysisType === "coffee_fortune") {
    return (
      <div className="space-y-4">
        {result.overall && (
          <Card className="glass-card p-4 border-amber-500/30 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-full flex-shrink-0 border border-amber-500/30">
                  <Coffee className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="text-lg font-bold text-amber-200">
                  Fincan Özeti
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {result.love && (
            <Card className="glass-card p-4 border-pink-500/30 text-white">
              <h4 className="text-sm font-semibold text-pink-200 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                Aşk
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.love}</p>
            </Card>
          )}

          {result.career && (
            <Card className="glass-card p-4 border-blue-500/30 text-white">
              <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Kariyer
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.career}</p>
            </Card>
          )}

          {result.finance && (
            <Card className="glass-card p-4 border-green-500/30 text-white">
              <h4 className="text-sm font-semibold text-green-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-400" />
                Finans
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.finance}</p>
            </Card>
          )}

          {result.health && (
            <Card className="glass-card p-4 border-red-500/30 text-white">
              <h4 className="text-sm font-semibold text-red-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                Sağlık
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.health}</p>
            </Card>
          )}
        </div>

        {result.future && (
          <Card className="glass-card p-4 border-purple-500/30 text-white">
            <h4 className="text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              Gelecek
            </h4>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{result.future}</p>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="glass-card p-4 border-amber-500/20 text-white">
            <h4 className="text-sm font-semibold text-amber-200 mb-3 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              Görülen Semboller
            </h4>
            <div className="grid gap-2">
              {result.symbols.slice(0, 3).map((symbol: any, index: number) => (
                <div key={index} className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-sm font-semibold text-amber-200">{symbol.name}</div>
                  <div className="text-xs text-white/70 mt-1 line-clamp-2">{symbol.meaning}</div>
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
      <div className="space-y-4">
        {result.overall && (
          <Card className="glass-card p-4 border-indigo-500/30 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-full flex-shrink-0 border border-indigo-500/30">
                  <Moon className="w-5 h-5 text-indigo-300" />
                </div>
                <h3 className="text-lg font-bold text-indigo-200">
                  Rüya Analizi
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        {result.symbols && result.symbols.length > 0 && (
          <Card className="glass-card p-4 border-purple-500/30 text-white">
            <h4 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Semboller
            </h4>
            <div className="grid gap-2">
              {result.symbols.slice(0, 3).map((symbol: any, index: number) => (
                <div key={index} className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-sm font-semibold text-purple-200">{symbol.symbol}</div>
                  <div className="text-xs text-white/70 mt-1 line-clamp-2">{symbol.meaning}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {result.psychological && (
            <Card className="glass-card p-4 border-blue-500/30 text-white">
              <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Psikolojik Anlam
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.psychological}</p>
            </Card>
          )}

          {result.spiritual && (
            <Card className="glass-card p-4 border-indigo-500/30 text-white">
              <h4 className="text-sm font-semibold text-indigo-200 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-400" />
                Manevi Mesaj
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.spiritual}</p>
            </Card>
          )}
        </div>

        {(result.advice || result.warnings) && (
          <div className="grid md:grid-cols-2 gap-4">
            {result.advice && (
              <Card className="glass-card p-4 border-green-500/30 text-white">
                <h4 className="text-sm font-semibold text-green-200 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-green-400" />
                  Tavsiye
                </h4>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{result.advice}</p>
              </Card>
            )}

            {result.warnings && (
              <Card className="glass-card p-4 border-orange-500/30 text-white">
                <h4 className="text-sm font-semibold text-orange-200 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-400" />
                  Uyarı
                </h4>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{result.warnings}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // Palmistry
  if (analysisType === "palmistry") {
    // Similar V2 update for palmistry
    return (
      <div className="space-y-4">
        {result.overall && (
          <Card className="glass-card p-4 border-teal-500/30 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-full flex-shrink-0 border border-teal-500/30">
                  <Hand className="w-5 h-5 text-teal-300" />
                </div>
                <h3 className="text-lg font-bold text-teal-200">
                  El Okuma Özeti
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                {result.overall}
              </p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {result.life_line && (
            <Card className="glass-card p-4 border-red-500/30 text-white">
              <h4 className="text-sm font-semibold text-red-200 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                Hayat Çizgisi
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.life_line}</p>
            </Card>
          )}
          {result.head_line && (
            <Card className="glass-card p-4 border-blue-500/30 text-white">
              <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Akıl Çizgisi
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.head_line}</p>
            </Card>
          )}
          {result.heart_line && (
            <Card className="glass-card p-4 border-pink-500/30 text-white">
              <h4 className="text-sm font-semibold text-pink-200 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                Kalp Çizgisi
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.heart_line}</p>
            </Card>
          )}
          {result.fate_line && (
            <Card className="glass-card p-4 border-purple-500/30 text-white">
              <h4 className="text-sm font-semibold text-purple-200 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                Kader Çizgisi
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.fate_line}</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Daily Horoscope
  if (analysisType === "daily_horoscope") {
    return (
      <div className="space-y-6">
        {result.general && (
          <Card className="glass-card p-6 border-violet-500/50 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-500/20 rounded-full border border-violet-500/30">
                  <Star className="w-6 h-6 text-violet-300" />
                </div>
                <h3 className="text-2xl font-bold text-violet-100">
                  Bugünkü Enerjiniz
                </h3>
              </div>
              <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap border-l-2 border-violet-500/30 pl-4">
                {result.general}
              </p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {result.love && (
            <Card className="glass-card p-5 border-pink-500/30 text-white">
              <h4 className="font-semibold text-pink-200 mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Aşk ve İlişkiler
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.love}</p>
            </Card>
          )}

          {result.career && (
            <Card className="glass-card p-5 border-blue-500/30 text-white">
              <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Kariyer
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.career}</p>
            </Card>
          )}

          {result.money && (
            <Card className="glass-card p-5 border-green-500/30 text-white">
              <h4 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                Para
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.money}</p>
            </Card>
          )}

          {result.health && (
            <Card className="glass-card p-5 border-red-500/30 text-white">
              <h4 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" />
                Sağlık
              </h4>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{result.health}</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Compatibility Analysis
  if (analysisType === "compatibility") {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-6 border-primary/40 text-white text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-full mb-4 shadow-glow border border-primary/30">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              %{result.overallScore} Uyum
            </h3>
            <Progress value={result.overallScore} className="h-2 mt-4 bg-white/10" />
          </div>
          <p className="text-base leading-relaxed text-white/80 mt-6 max-w-2xl mx-auto">
            {result.overallSummary}
          </p>
        </Card>

        {result.compatibilityAreas && result.compatibilityAreas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white px-2">Uyum Detayları</h3>
            {result.compatibilityAreas.map((area: CompatibilityArea, index: number) => (
              <Card key={index} className="glass-card p-5 border-white/5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white/90">{area.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">%{area.compatibilityScore}</span>
                    <Progress value={area.compatibilityScore} className="w-24 h-2 bg-white/10" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-400 uppercase mb-1">Güçlü Yanlar</p>
                    <p className="text-sm text-white/80">{area.strengths}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs font-semibold text-orange-400 uppercase mb-1">Dikkat</p>
                    <p className="text-sm text-white/80">{area.challenges}</p>
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
          <Card className="glass-card p-6 border-purple-500/30 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-full border border-purple-500/30">
                  <Star className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-2xl font-bold text-purple-100">
                  Gezegen Konumları
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-12">
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
                    <div key={planet} className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="font-semibold text-purple-200 mb-1">
                        {planetNames[planet] || planet}:
                      </span>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                          {data.burc}
                        </Badge>
                        <span className="text-xs text-white/50">{data.derece}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {generalEvaluation && (
          <Card className="glass-card p-6 border-indigo-500/30 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold text-indigo-100">
                  Genel Değerlendirme
                </h3>
              </div>
              <p className="text-base leading-relaxed text-white/90 pl-12 whitespace-pre-wrap">
                {generalEvaluation}
              </p>
            </div>
          </Card>
        )}

        {Object.entries(topics).map(([topicName, topicData]: [string, any]) => (
          <Card key={topicName} className="glass-card p-6 border-white/10 hover:border-primary/40 transition-all text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              {topicName}
            </h3>

            <div className="space-y-6 relative z-10">
              {topicData.genel_bakis && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white/90 mb-2 text-sm uppercase tracking-wide opacity-70">Genel Bakış</h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.genel_bakis}
                  </p>
                </div>
              )}
              {topicData.ozellikler && topicData.ozellikler.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white/90 mb-2 text-sm uppercase tracking-wide opacity-70">Özellikler</h4>
                  <ul className="grid gap-2 text-sm text-white/80">
                    {topicData.ozellikler.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {topicData.guclu_yonler && (
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Güçlü Yönler
                    </h4>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {topicData.guclu_yonler}
                    </p>
                  </div>
                )}
                {topicData.dikkat_edilmesi_gerekenler && (
                  <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <h4 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Dikkat
                    </h4>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {topicData.dikkat_edilmesi_gerekenler}
                    </p>
                  </div>
                )}
              </div>

              {topicData.tavsiyeler && (
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-2">
                  <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Tavsiyeler
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
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

  // Numerology
  if (analysisType === "numerology") {
    const topics = result.topics || {};
    const overallSummary = result.overall_summary || "";

    return (
      <div className="space-y-6">
        {overallSummary && (
          <Card className="glass-card p-6 border-cyan-500/30 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 rounded-full border border-cyan-500/30">
                  <Star className="w-6 h-6 text-cyan-300" />
                </div>
                <h3 className="text-2xl font-bold text-cyan-100">
                  Genel Numeroloji Özeti
                </h3>
              </div>
              <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap pl-2">
                {overallSummary}
              </p>
            </div>
          </Card>
        )}

        {Object.entries(topics).map(([topicName, topicData]: [string, any]) => (
          <Card key={topicName} className="glass-card p-6 border-white/10 hover:border-cyan-500/40 transition-all text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />

            <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              {topicName}
            </h3>

            <div className="space-y-6 relative z-10">
              {topicData.calculation && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="font-semibold text-white/90 mb-2 text-sm uppercase tracking-wide opacity-70">Hesaplama</h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.calculation}
                  </p>
                </div>
              )}

              {topicData.meaning && (
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Okült & Ezoterik Anlam
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.meaning}
                  </p>
                </div>
              )}

              {topicData.personal_interpretation && (
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Kişisel Yorum
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.personal_interpretation}
                  </p>
                </div>
              )}

              {topicData.references && (
                <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 mt-2">
                  <h4 className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Referanslar & Bağlantılar
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {topicData.references}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Card className="glass-card p-6 text-white border-white/10">
        <p className="text-center text-white/50">Analiz sonucu yüklenemedi veya desteklenmeyen format.</p>
      </Card>
    </div>
  );
};