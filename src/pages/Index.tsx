import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { TopicSelector } from "@/components/TopicSelector";
import { AnalysisResults, type AnalysisResult } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setCredits(profile.credits);
      }
    }
  };

  const handleFileSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setAnalysisResult(null);
  };

  const handleAnalyze = async (selectedTopics: string[]) => {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Giriş Gerekli",
        description: "Analiz yapmak için giriş yapmanız gerekiyor.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedFile || selectedTopics.length === 0) return;

    // Check credits
    if (credits < selectedTopics.length) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu analiz için ${selectedTopics.length} kredi gerekiyor. Mevcut krediniz: ${credits}`,
        variant: "destructive",
      });
      navigate("/credits");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 500);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(selectedFile);
      const base64Image = await base64Promise;

      console.log("Calling analyze-handwriting function...");
      
      const { data, error } = await supabase.functions.invoke("analyze-handwriting", {
        body: { 
          image: base64Image,
          selectedTopics: selectedTopics.length > 0 ? selectedTopics : undefined
        },
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (data.error) {
        if (data.error === "Insufficient credits") {
          toast({
            title: "Yetersiz kredi",
            description: `${data.required} kredi gerekli, ${data.available} krediniz var.`,
            variant: "destructive",
          });
          clearInterval(progressInterval);
          setIsAnalyzing(false);
          return;
        }
        throw new Error(data.error);
      }

      console.log("Analysis completed:", data);
      setAnalysisResult(data);
      await loadCredits();
      
      toast({
        title: "Analiz tamamlandı",
        description: "El yazısı başarıyla analiz edildi.",
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Analysis error:", error);
      toast({
        title: "Analiz hatası",
        description: error.message || "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {!analysisResult ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            <UploadZone onFileSelect={handleFileSelect} />

            {/* Preview and Analyze */}
            {selectedFile && previewUrl && (
              <>
                <Card className="p-6 space-y-4 shadow-card">
                  <h2 className="text-xl font-bold text-foreground">Yüklenen Dosya</h2>
                  
                  {previewUrl === "pdf" ? (
                    <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                      <FileText className="w-12 h-12 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={previewUrl}
                        alt="Yüklenen el yazısı"
                        className="w-full h-auto max-h-96 object-contain bg-muted"
                      />
                    </div>
                  )}
                </Card>

                {isAnalyzing && (
                  <Card className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Analiz ediliyor...</span>
                        <span className="text-primary font-bold">{analysisProgress}%</span>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        Bu işlem birkaç dakika sürebilir. Lütfen bekleyin.
                      </p>
                    </div>
                  </Card>
                )}

                {!isAnalyzing && (
                  <TopicSelector 
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    availableCredits={credits}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Analiz Sonuçları</h2>
                <p className="text-muted-foreground mt-2">
                  Detaylı grafologi değerlendirmesi
                </p>
              </div>
              <Button onClick={handleReset} variant="outline">
                Yeni Analiz
              </Button>
            </div>

            <AnalysisResults result={analysisResult} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>El Yazısı Analizi - Grafologi tabanlı AI destekli kişilik değerlendirmesi</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
