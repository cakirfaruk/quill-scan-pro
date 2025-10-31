import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Moon } from "lucide-react";

const DreamInterpretation = () => {
  const navigate = useNavigate();
  const [dreamDescription, setDreamDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);

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
        .single();
      
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
      const { data, error } = await supabase.functions.invoke('interpret-dream', {
        body: { dreamDescription }
      });

      if (error) throw error;

      setResult(data.interpretation);
      setUserCredits(prev => prev - 20);
      toast.success("Rüya tabiriniz hazır!");
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
                <CardTitle>🌙 Rüya Tabiriniz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.symbols && result.symbols.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">🔮 Rüyadaki Semboller:</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {result.symbols.map((symbol: any, index: number) => (
                        <div key={index} className="p-3 bg-background rounded">
                          <div className="font-semibold">{symbol.symbol}</div>
                          <div className="text-sm mt-1">{symbol.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.psychological && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🧠 Psikolojik Yorum:</h3>
                    <p className="whitespace-pre-wrap">{result.psychological}</p>
                  </div>
                )}

                {result.spiritual && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">✨ Manevi Yorum:</h3>
                    <p className="whitespace-pre-wrap">{result.spiritual}</p>
                  </div>
                )}

                {result.future_signs && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🔮 Gelecek İşaretleri:</h3>
                    <p className="whitespace-pre-wrap">{result.future_signs}</p>
                  </div>
                )}

                {result.advice && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💡 Tavsiyeler:</h3>
                    <p className="whitespace-pre-wrap">{result.advice}</p>
                  </div>
                )}

                {result.warnings && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">⚠️ Uyarılar:</h3>
                    <p className="whitespace-pre-wrap">{result.warnings}</p>
                  </div>
                )}

                {result.overall && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-bold text-lg mb-2">📋 Genel Özet:</h3>
                    <p className="whitespace-pre-wrap">{result.overall}</p>
                  </div>
                )}

                {result.raw && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{result.raw}</p>
                  </div>
                )}

                <Button onClick={() => { setResult(null); setDreamDescription(""); }} className="w-full">
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