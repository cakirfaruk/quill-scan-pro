import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, Sparkles, Shield } from "lucide-react";
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20 text-center max-w-5xl">
        <div className="mb-8 sm:mb-10 md:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent px-2">
            El Yazınız, Kişiliğinizin Aynası
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-7 md:mb-8 max-w-3xl mx-auto px-4">
            Yapay zeka destekli grafologi analizimiz ile el yazınızdan 
            kişilik özelliklerinizi keşfedin. Profesyonel, hızlı ve güvenilir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
          <Card className="p-4 sm:p-5 md:p-6 hover:shadow-elegant transition-all group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 sm:mb-3.5 md:mb-4 mx-auto group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base sm:text-base md:text-lg mb-1.5 sm:mb-1.5 md:mb-2">Kolay Kullanım</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              El yazısını yükle, konuları seç, dakikalar içinde sonuçları gör
            </p>
          </Card>
          <Card className="p-4 sm:p-5 md:p-6 hover:shadow-elegant transition-all group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 sm:mb-3.5 md:mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base sm:text-base md:text-lg mb-1.5 sm:mb-1.5 md:mb-2">AI Teknolojisi</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gelişmiş yapay zeka ile hassas ve detaylı analizler
            </p>
          </Card>
          <Card className="p-4 sm:p-5 md:p-6 hover:shadow-elegant transition-all group sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 sm:mb-3.5 md:mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base sm:text-base md:text-lg mb-1.5 sm:mb-1.5 md:mb-2">Güvenli ve Gizli</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Verileriniz şifrelenir ve kimseyle paylaşılmaz
            </p>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-10 lg:py-12 max-w-6xl">
        {!analysisResult ? (
          <div className="space-y-6 sm:space-y-7 md:space-y-8">
            {/* Upload Zone */}
            <UploadZone onFileSelect={handleFileSelect} />

            {/* Preview and Analyze */}
            {selectedFile && previewUrl && (
              <>
                <Card className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-3.5 md:space-y-4 shadow-card">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Yüklenen Dosya</h2>
                  
                  {previewUrl === "pdf" ? (
                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 bg-muted rounded-lg">
                      <FileText className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={previewUrl}
                        alt="Yüklenen el yazısı"
                        className="w-full h-auto max-h-64 sm:max-h-80 md:max-h-96 object-contain bg-muted"
                      />
                    </div>
                  )}
                </Card>

                {isAnalyzing && (
                  <Card className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-2.5 sm:space-y-3">
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
          <div className="space-y-6 sm:space-y-7 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-foreground">Analiz Sonuçları</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                  Detaylı grafologi değerlendirmesi
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
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
