import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Sparkles, Heart } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface AnalysisRecord {
  id: string;
  created_at: string;
  analysis_type: string;
  selected_topics: string[] | null;
  credits_used: number;
  result: any;
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
      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
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
    return type;
  };

  const getAnalysisIcon = (type: string) => {
    if (type === "compatibility") return <Heart className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
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
                  {format(new Date(analysis.created_at), "d MMMM yyyy, HH:mm", {
                    locale: tr,
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
                    {format(new Date(selectedAnalysis.created_at), "d MMMM yyyy, HH:mm", {
                      locale: tr,
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
