import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CompactHeader } from "@/components/CompactHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareResultButton } from "@/components/ShareResultButton";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { Loader2, Search, Calendar, Filter, Sparkles, Coffee, Moon, Hand, Heart, Star, Zap, Eye, X, BookmarkPlus, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Analysis {
  id: string;
  type: string;
  title: string;
  summary: string;
  created_at: string;
  credits_used: number;
  icon: any;
  color: string;
  result?: any;
  isFavorite?: boolean;
}

const analysisTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  tarot: { icon: Sparkles, label: "Tarot Falı", color: "text-purple-500" },
  coffee_fortune: { icon: Coffee, label: "Kahve Falı", color: "text-amber-500" },
  dream: { icon: Moon, label: "Rüya Tabiri", color: "text-indigo-500" },
  palmistry: { icon: Hand, label: "El Okuma", color: "text-teal-500" },
  compatibility: { icon: Heart, label: "Uyumluluk", color: "text-pink-500" },
  birth_chart: { icon: Star, label: "Doğum Haritası", color: "text-yellow-500" },
  daily_horoscope: { icon: Star, label: "Günlük Burç", color: "text-violet-500" },
  numerology: { icon: Zap, label: "Numeroloji", color: "text-blue-500" },
};

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const analysisContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyses();
    loadFavorites();

    // Subscribe to favorites changes
    const channel = supabase
      .channel("favorites-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorite_analyses",
        },
        () => {
          loadFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, searchQuery, selectedType, showFavoritesOnly, favorites]);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("favorite_analyses")
        .select("analysis_id, analysis_type")
        .eq("user_id", user.id);

      if (data) {
        const favoriteSet = new Set(data.map(f => `${f.analysis_id}-${f.analysis_type}`));
        setFavorites(favoriteSet);
      }
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const allAnalyses: Analysis[] = [];

      // Load from analysis_history table
      const { data: historyData } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (historyData) {
        historyData.forEach(item => {
          const config = analysisTypeConfig[item.analysis_type] || {
            icon: Sparkles,
            label: item.analysis_type,
            color: "text-primary",
          };

          const result = item.result as any;
          const summary = result?.summary || result?.genel_yorum || result?.interpretation?.summary || "Analiz tamamlandı";

          allAnalyses.push({
            id: item.id,
            type: item.analysis_type,
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.result,
          });
        });
      }

      // Load birth chart analyses
      const { data: birthChartData } = await supabase
        .from("birth_chart_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (birthChartData) {
        birthChartData.forEach(item => {
          const config = analysisTypeConfig.birth_chart;
          const result = item.result as any;
          const summary = result?.summary || "Doğum haritası analizi tamamlandı";

          allAnalyses.push({
            id: item.id,
            type: "birth_chart",
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.result,
          });
        });
      }

      // Load compatibility analyses
      const { data: compatibilityData } = await supabase
        .from("compatibility_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (compatibilityData) {
        compatibilityData.forEach(item => {
          const config = analysisTypeConfig.compatibility;
          const result = item.result as any;
          const summary = result?.summary || result?.genel_uyum || "Uyumluluk analizi tamamlandı";

          allAnalyses.push({
            id: item.id,
            type: "compatibility",
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.result,
          });
        });
      }

      // Load coffee fortune readings
      const { data: coffeeData } = await supabase
        .from("coffee_fortune_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (coffeeData) {
        coffeeData.forEach(item => {
          const config = analysisTypeConfig.coffee_fortune;
          const result = item.interpretation as any;
          const summary = result?.summary || result?.genel_yorum || "Kahve falı yorumu tamamlandı";

          allAnalyses.push({
            id: item.id,
            type: "coffee_fortune",
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.interpretation,
          });
        });
      }

      // Load dream interpretations
      const { data: dreamData } = await supabase
        .from("dream_interpretations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dreamData) {
        dreamData.forEach(item => {
          const config = analysisTypeConfig.dream;
          const result = item.interpretation as any;
          const summary = result?.summary || result?.genel_yorum || "Rüya tabiri tamamlandı";

          allAnalyses.push({
            id: item.id,
            type: "dream",
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.interpretation,
          });
        });
      }

      // Load daily horoscopes
      const { data: horoscopeData } = await supabase
        .from("daily_horoscopes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (horoscopeData) {
        horoscopeData.forEach(item => {
          const config = analysisTypeConfig.daily_horoscope;
          const result = item.horoscope_text as any;
          const summary = result?.genel || "Günlük burç yorumu";

          allAnalyses.push({
            id: item.id,
            type: "daily_horoscope",
            title: config.label,
            summary: typeof summary === 'string' ? summary.substring(0, 150) + "..." : "Detayları görüntüle",
            created_at: item.created_at,
            credits_used: item.credits_used,
            icon: config.icon,
            color: config.color,
            result: item.horoscope_text,
          });
        });
      }

      // Sort all analyses by date
      allAnalyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Mark favorites
      const analyzesWithFavorites = allAnalyses.map(analysis => ({
        ...analysis,
        isFavorite: favorites.has(`${analysis.id}-${analysis.type}`)
      }));

      setAnalyses(analyzesWithFavorites);
    } catch (error: any) {
      console.error("Error loading analyses:", error);
      toast({
        title: "Hata",
        description: "Analizler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = analyses;

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(a => a.isFavorite);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query)
      );
    }

    setFilteredAnalyses(filtered);
  };

  const toggleFavorite = async (analysis: Analysis) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const favoriteKey = `${analysis.id}-${analysis.type}`;
      const isFavorite = favorites.has(favoriteKey);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_analyses")
          .delete()
          .eq("user_id", user.id)
          .eq("analysis_id", analysis.id)
          .eq("analysis_type", analysis.type);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(favoriteKey);
          return newSet;
        });

        toast({
          title: "Favorilerden Çıkarıldı",
          description: "Analiz favorilerinizden kaldırıldı",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorite_analyses")
          .insert({
            user_id: user.id,
            analysis_id: analysis.id,
            analysis_type: analysis.type,
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(favoriteKey));

        toast({
          title: "Favorilere Eklendi",
          description: "Analiz favorilerinize eklendi",
        });
      }

      // Reload analyses to update favorite status
      loadAnalyses();
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleViewAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setDetailModalOpen(true);
  };

  const formatAnalysisContent = (analysis: Analysis): string => {
    const title = analysis.title;
    let content = `📊 *${title}*\n\n`;
    
    if (!analysis.result) {
      return content + analysis.summary;
    }

    const result = analysis.result;

    // Format based on analysis type
    switch(analysis.type) {
      case "tarot":
        if (result.overall) content += `🌟 *Özet*\n${result.overall}\n\n`;
        if (result.cards?.length > 0) {
          content += `🃏 *Kartlar*\n`;
          result.cards.forEach((card: any, i: number) => {
            content += `${i + 1}. ${card.interpretation}\n`;
          });
          content += "\n";
        }
        if (result.advice) content += `💡 *Tavsiye*\n${result.advice}\n\n`;
        if (result.warnings) content += `⚠️ *Dikkat*\n${result.warnings}\n`;
        break;

      case "coffee_fortune":
        if (result.overall) content += `☕ *Özet*\n${result.overall}\n\n`;
        if (result.love) content += `💖 *Aşk*\n${result.love}\n\n`;
        if (result.career) content += `💼 *Kariyer*\n${result.career}\n\n`;
        if (result.finance) content += `💰 *Finans*\n${result.finance}\n\n`;
        if (result.health) content += `🏥 *Sağlık*\n${result.health}\n\n`;
        if (result.future) content += `🔮 *Gelecek*\n${result.future}\n`;
        break;

      case "dream":
        if (result.overall) content += `🌙 *Özet*\n${result.overall}\n\n`;
        if (result.psychological) content += `🧠 *Psikolojik*\n${result.psychological}\n\n`;
        if (result.spiritual) content += `✨ *Manevi*\n${result.spiritual}\n\n`;
        if (result.future_signs) content += `🔮 *Gelecek*\n${result.future_signs}\n\n`;
        if (result.advice) content += `💡 *Tavsiye*\n${result.advice}\n`;
        break;

      case "palmistry":
        if (result.overall) content += `🖐️ *Özet*\n${result.overall}\n\n`;
        if (result.life_line) content += `❤️ *Hayat Çizgisi*\n${result.life_line}\n\n`;
        if (result.head_line) content += `🧠 *Akıl Çizgisi*\n${result.head_line}\n\n`;
        if (result.heart_line) content += `💝 *Kalp Çizgisi*\n${result.heart_line}\n\n`;
        if (result.personality) content += `👤 *Kişilik*\n${result.personality}\n`;
        break;

      case "daily_horoscope":
        if (result.genel) content += `⭐ *Genel*\n${result.genel}\n\n`;
        if (result.ask) content += `💖 *Aşk*\n${result.ask}\n\n`;
        if (result.kariyer) content += `💼 *Kariyer*\n${result.kariyer}\n\n`;
        if (result.para) content += `💰 *Para*\n${result.para}\n\n`;
        if (result.saglik) content += `🏥 *Sağlık*\n${result.saglik}\n`;
        break;

      case "compatibility":
        if (result.summary) content += `💑 *Özet*\n${result.summary}\n\n`;
        if (result.overall_score) content += `📊 *Uyumluluk Skoru*: ${result.overall_score}/100\n\n`;
        if (result.areas?.length > 0) {
          content += `🔍 *Uyumluluk Alanları*\n`;
          result.areas.forEach((area: any) => {
            content += `\n*${area.name}* (${area.compatibilityScore}/100)\n`;
            content += `Güçlü Yönler: ${area.strengths}\n`;
            if (area.recommendations) content += `Tavsiyeler: ${area.recommendations}\n`;
          });
        }
        break;

      case "birth_chart":
        if (result.genel_degerlendirme) content += `🌟 *Genel Değerlendirme*\n${result.genel_degerlendirme}\n\n`;
        if (result.planetary_positions?.length > 0) {
          content += `🪐 *Gezegen Konumları*\n`;
          result.planetary_positions.forEach((p: any) => {
            content += `${p.planet}: ${p.sign} (${p.degree}°)\n`;
          });
          content += "\n";
        }
        break;

      case "numerology":
        if (result.genel_degerlendirme) content += `🔢 *Genel*\n${result.genel_degerlendirme}\n\n`;
        
        const topics = [
          { key: "kader_rakami", label: "Kader Rakamı" },
          { key: "ruh_arzusu_rakami", label: "Ruh Arzusu" },
          { key: "kisilik_rakami", label: "Kişilik Rakamı" },
          { key: "dogum_gunu_rakami", label: "Doğum Günü" },
          { key: "olgunluk_rakami", label: "Olgunluk Rakamı" }
        ];

        topics.forEach(topic => {
          if (result[topic.key]) {
            content += `✨ *${topic.label}*\n${result[topic.key]}\n\n`;
          }
        });
        break;

      default:
        content += analysis.summary;
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-background">
      <CompactHeader />
      
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analiz Geçmişi</h1>
          <p className="text-muted-foreground">Tüm analizlerinizi görüntüleyin ve paylaşın</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Analiz ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Bookmark className="w-4 h-4" />
            {showFavoritesOnly ? "Tüm Analizler" : "Favoriler"}
          </Button>
        </div>

        {/* Type Filter Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Tümü
            </TabsTrigger>
            {Object.entries(analysisTypeConfig).map(([key, config]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <Filter className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedType !== "all" 
                    ? "Arama kriterlerinize uygun analiz bulunamadı" 
                    : "Henüz hiç analiz yapmadınız"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => {
              const Icon = analysis.icon;
              return (
                <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className={`w-5 h-5 ${analysis.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{analysis.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {analysis.credits_used} Kredi
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(analysis.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(analysis);
                        }}
                        className="flex-shrink-0"
                      >
                        {analysis.isFavorite ? (
                          <Bookmark className="w-5 h-5 fill-primary text-primary" />
                        ) : (
                          <BookmarkPlus className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {analysis.summary}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnalysis(analysis)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detayları Gör
                      </Button>
                      <ShareResultButton
                        content={formatAnalysisContent(analysis)}
                        title={analysis.title}
                        analysisId={analysis.id}
                        analysisType={analysis.type}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Analysis Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                {selectedAnalysis && (
                  <>
                    <div className="p-2 rounded-lg bg-primary/10">
                      {(() => {
                        const Icon = selectedAnalysis.icon;
                        return <Icon className={`w-5 h-5 ${selectedAnalysis.color}`} />;
                      })()}
                    </div>
                    <div>
                      <span>{selectedAnalysis.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {selectedAnalysis.credits_used} Kredi
                        </Badge>
                        <span className="text-xs text-muted-foreground font-normal">
                          {format(new Date(selectedAnalysis.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDetailModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div ref={analysisContentRef}>
              {selectedAnalysis && selectedAnalysis.result && (
                <AnalysisDetailView
                  analysisType={selectedAnalysis.type}
                  result={selectedAnalysis.result}
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 pt-4 border-t mt-4 flex gap-2">
            <ShareResultButton
              content={selectedAnalysis ? formatAnalysisContent(selectedAnalysis) : ""}
              title={selectedAnalysis?.title || ""}
              analysisId={selectedAnalysis?.id}
              analysisType={selectedAnalysis?.type}
              contentRef={analysisContentRef}
              variant="default"
              size="default"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setDetailModalOpen(false)}
            >
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
