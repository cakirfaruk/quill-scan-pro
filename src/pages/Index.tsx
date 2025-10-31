import { useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisResults, type AnalysisResult } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    
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
        body: { image: base64Image },
      });

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Analysis completed:", data);
      setAnalysisResult(data);
      
      toast({
        title: "Analiz tamamlandı",
        description: "El yazısı başarıyla analiz edildi.",
      });
    } catch (error: any) {
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
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  El Yazısı Analizi
                </h1>
                <p className="text-sm text-muted-foreground">
                  Grafolog uzmanı AI ile profesyonel analiz
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {!analysisResult ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            <UploadZone onFileSelect={handleFileSelect} />

            {/* Preview and Analyze */}
            {selectedFile && previewUrl && (
              <Card className="p-8 space-y-6 shadow-card">
                <div className="space-y-4">
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
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-elegant"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analiz ediliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Analizi Başlat
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    disabled={isAnalyzing}
                  >
                    İptal
                  </Button>
                </div>
              </Card>
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
