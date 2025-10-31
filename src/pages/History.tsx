import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Sparkles, Heart } from "lucide-react";

interface AnalysisRecord {
  id: string;
  created_at: string;
  analysis_type: string;
  selected_topics?: string[] | null;
  credits_used: number;
  result: any;
  full_name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  gender1?: string;
  gender2?: string;
}

const History = () => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadHistory();
  };

  const loadHistory = async () => {
    try {
      // Fetch handwriting analyses
      const { data: handwritingData, error: handwritingError } = await supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (handwritingError) throw handwritingError;

      // Fetch numerology analyses
      const { data: numerologyData, error: numerologyError } = await supabase
        .from("numerology_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (numerologyError) throw numerologyError;

      // Fetch birth chart analyses
      const { data: birthChartData, error: birthChartError } = await supabase
        .from("birth_chart_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (birthChartError) throw birthChartError;

      // Fetch compatibility analyses
      const { data: compatibilityData, error: compatibilityError } = await supabase
        .from("compatibility_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (compatibilityError) throw compatibilityError;

      // Combine all analyses into a single array
      const allAnalyses: AnalysisRecord[] = [
        ...(handwritingData || []),
        ...(numerologyData || []).map(item => ({
          ...item,
          analysis_type: "numerology"
        })),
        ...(birthChartData || []).map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })),
        ...(compatibilityData || []).map(item => ({
          ...item,
          analysis_type: "compatibility"
        })),
      ];

      // Sort by created_at descending
      allAnalyses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAnalyses(allAnalyses);
    } catch (error: any) {
      console.error("Error loading history:", error);
      toast({
        title: "Hata",
        description: "Geçmiş analizler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    if (type === "handwriting") return "El Yazısı Analizi";
    if (type === "compatibility") return "Uyum Analizi";
    if (type === "numerology") return "Numeroloji Analizi";
    if (type === "birth_chart") return "Doğum Haritası Analizi";
    return type;
  };

  const getAnalysisIcon = (type: string) => {
    if (type === "compatibility") return <Heart className="w-5 h-5" />;
    if (type === "numerology") return <Sparkles className="w-5 h-5" />;
    if (type === "birth_chart") return <Calendar className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const renderAnalysisDetails = (analysis: AnalysisRecord) => {
    if (analysis.analysis_type === "numerology") {
      return (
        <div className="space-y-2 mb-3">
          {analysis.full_name && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Ad Soyad:</span> {analysis.full_name}
            </p>
          )}
          {analysis.birth_date && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Doğum Tarihi:</span> {new Date(analysis.birth_date).toLocaleDateString("tr-TR")}
            </p>
          )}
        </div>
      );
    }
    
    if (analysis.analysis_type === "birth_chart") {
      return (
        <div className="space-y-2 mb-3">
          {analysis.full_name && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Ad Soyad:</span> {analysis.full_name}
            </p>
          )}
          {analysis.birth_date && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Doğum:</span> {new Date(analysis.birth_date).toLocaleDateString("tr-TR")} {analysis.birth_time}
            </p>
          )}
          {analysis.birth_place && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Yer:</span> {analysis.birth_place}
            </p>
          )}
        </div>
      );
    }
    
    if (analysis.analysis_type === "compatibility") {
      return (
        <div className="space-y-2 mb-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">İki kişi arası uyum analizi</span>
          </p>
          {analysis.result?.analysisTypes && (
            <div className="flex flex-wrap gap-1">
              {analysis.result.analysisTypes.map((type: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {type === "handwriting" ? "El Yazısı" : type === "numerology" ? "Numeroloji" : "Doğum Haritası"}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            Geçmiş Analizler
          </h1>
          <p className="text-muted-foreground">
            Tüm geçmiş analiz sonuçlarınızı buradan görüntüleyebilirsiniz
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : analyses.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Henüz analiz yok</h3>
            <p className="text-muted-foreground mb-6">
              İlk analizinizi yapmak için ana sayfaya gidin
            </p>
            <Button onClick={() => navigate("/")}>Analiz Yap</Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="p-6 hover:shadow-elegant transition-all cursor-pointer group"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    {getAnalysisIcon(analysis.analysis_type)}
                  </div>
                  <Badge variant="secondary">{analysis.credits_used} Kredi</Badge>
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {getAnalysisTypeLabel(analysis.analysis_type)}
                </h3>

                {renderAnalysisDetails(analysis)}

                {analysis.selected_topics && analysis.selected_topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {analysis.selected_topics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {analysis.selected_topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{analysis.selected_topics.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedAnalysis && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnalysis(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnalysis.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                  Kapat
                </Button>
              </div>

              <div className="space-y-4">
                {selectedAnalysis.result && typeof selectedAnalysis.result === "object" && (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                      {JSON.stringify(selectedAnalysis.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
