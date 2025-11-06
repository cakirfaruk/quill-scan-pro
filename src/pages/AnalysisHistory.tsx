import { useState, useEffect } from "react";
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
import { Loader2, Search, Calendar, Filter, Sparkles, Coffee, Moon, Hand, Heart, Star, Zap, Eye, X } from "lucide-react";
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
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, searchQuery, selectedType]);

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

      setAnalyses(allAnalyses);
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

  const handleViewAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setDetailModalOpen(true);
  };

  const formatAnalysisContent = (analysis: Analysis): string => {
    const title = analysis.title;
    const summary = analysis.summary;
    return `📊 **${title}**\n\n${summary}\n\n[Analiz ID: ${analysis.id}]\n[Analiz Türü: ${analysis.type}]`;
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
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className={`w-5 h-5 ${analysis.color}`} />
                        </div>
                        <div>
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
            {selectedAnalysis && selectedAnalysis.result && (
              <AnalysisDetailView
                analysisType={selectedAnalysis.type}
                result={selectedAnalysis.result}
              />
            )}
          </div>

          <div className="flex-shrink-0 pt-4 border-t mt-4 flex gap-2">
            <ShareResultButton
              content={selectedAnalysis ? formatAnalysisContent(selectedAnalysis) : ""}
              title={selectedAnalysis?.title || ""}
              analysisId={selectedAnalysis?.id}
              analysisType={selectedAnalysis?.type}
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
