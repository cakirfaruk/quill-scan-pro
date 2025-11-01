import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { TopicSelector } from "@/components/TopicSelector";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Handwriting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [availableCredits, setAvailableCredits] = useState(0);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (data) setAvailableCredits(data.credits);
  };

  const handleFileSelect = (file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
  };

  const handleAnalyze = async (selectedTopics: string[]) => {
    if (!selectedFile) {
      toast({
        title: "Dosya Seçilmedi",
        description: "Lütfen analiz edilecek bir dosya yükleyin.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-handwriting", {
          body: { image: base64, selectedTopics },
        });

        if (error) throw error;

        setAnalysisResult(data.result);
        setAvailableCredits((prev) => prev - selectedTopics.length);
        
        toast({
          title: "Analiz Tamamlandı",
          description: `${selectedTopics.length} kredi kullanıldı.`,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Analiz sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysisResult(null);
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnalysisDetailView result={analysisResult} analysisType="handwriting" />
            <Button onClick={handleReset} className="w-full">Yeni Analiz Yap</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">El Yazısı Analizi</h1>
            <p className="text-muted-foreground">El yazınızı yükleyin ve detaylı kişilik analizi yapın</p>
          </div>

          <UploadZone onFileSelect={handleFileSelect} />

          {selectedFile && previewUrl && previewUrl !== "pdf" && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={previewUrl} alt="Preview" className="w-full h-auto" />
            </div>
          )}

          {selectedFile && (
            <TopicSelector
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              availableCredits={availableCredits}
            />
          )}
        </div>
      </main>
    </div>
  );
}
