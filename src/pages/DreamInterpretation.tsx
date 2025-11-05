import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Moon } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { ShareButton } from "@/components/ShareButton";
import { useOGImage } from "@/hooks/use-og-image";
import { sendAnalysisNotification } from "@/utils/sendAnalysisNotification";

const DreamInterpretation = () => {
  const navigate = useNavigate();
  const [dreamDescription, setDreamDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  
  // Generate OG image when result is available
  useOGImage({
    title: result ? 'Rüya Tabiri' : '',
    description: result?.interpretation?.overview || '',
    type: 'dream'
  });

  useEffect(() => {
    checkAuth();
    loadCredits();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile) {
        setUserCredits(profile.credits);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!dreamDescription.trim() || dreamDescription.length < 20) {
      toast.error("Lütfen rüyanızı detaylı olarak anlatın (en az 20 karakter)");
      return;
    }

    if (userCredits < 20) {
      toast.error("Yetersiz kredi. Lütfen kredi satın alın.");
      navigate("/credits");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('interpret-dream', {
        body: { dreamDescription },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      setResult(data.interpretation);
      setUserCredits(prev => prev - 20);
      toast.success("Rüya tabiriniz hazır!");
      
      // Send push notification
      if (user) {
        sendAnalysisNotification(
          user.id,
          'dream',
          'Rüya Tabiriniz Hazır'
        );
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Analiz sırasında hata oluştu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-background to-background dark:from-indigo-950/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🌙 Rüya Tabiri
          </h1>
          <p className="text-muted-foreground">
            Rüyanızı anlatın, size ne anlama geldiğini söyleyelim
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Mevcut Kredi:</span>
            <span className="font-bold text-lg">{userCredits}</span>
            <span className="text-sm text-muted-foreground">| Maliyet: 20 kredi</span>
          </div>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Rüyanızı Anlatın</CardTitle>
              <CardDescription>
                Rüyanızı mümkün olduğunca detaylı anlatın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Rüyamda... (Gördüğünüz yeri, kişileri, olayları, duyguları detaylı anlatın)"
                value={dreamDescription}
                onChange={(e) => setDreamDescription(e.target.value)}
                rows={10}
                className="resize-none"
              />

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  İpuçları:
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Rüyada neler gördünüz?</li>
                  <li>• Hangi kişiler vardı?</li>
                  <li>• Nerede geçiyordu?</li>
                  <li>• Nasıl hissettiniz?</li>
                  <li>• Renkler, sesler, kokular var mıydı?</li>
                </ul>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!dreamDescription.trim() || dreamDescription.length < 20 || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Yorumlanıyor...
                  </>
                ) : (
                  <>Rüyayı Yorumla (20 Kredi)</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>🌙 Rüya Tabiriniz</CardTitle>
                    <CardDescription>Rüyanız yorumlandı</CardDescription>
                  </div>
                  <ShareButton
                    title="Rüya Tabirim - Astro Social"
                    text="Rüyamı yorumlattım! 🌙 AI ile rüya tabiri sonuçlarımı Astro Social'da keşfedin!"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <AnalysisDetailView result={result} analysisType="dream" />
                
                <Button onClick={() => { setResult(null); setDreamDescription(""); }} className="w-full mt-6">
                  Yeni Rüya Yorumla
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DreamInterpretation;