import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Sparkles, Hand } from "lucide-react";

const Palmistry = () => {
  const navigate = useNavigate();
  const [handImage, setHandImage] = useState<string>("");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fotoğraf boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setHandImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!handImage) {
      toast.error("Lütfen avuç içi fotoğrafı yükleyin");
      return;
    }

    if (userCredits < 35) {
      toast.error("Yetersiz kredi. Lütfen kredi satın alın.");
      navigate("/credits");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-palmistry', {
        body: { handImage }
      });

      if (error) throw error;

      setResult(data.interpretation);
      setUserCredits(prev => prev - 35);
      toast.success("El okumanız hazır!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Analiz sırasında hata oluştu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-background to-background dark:from-teal-950/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            🤲 El Okuma (Palmistry)
          </h1>
          <p className="text-muted-foreground">
            Avuç içi çizgileriniz sizin hakkınızda neler söylüyor?
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Mevcut Kredi:</span>
            <span className="font-bold text-lg">{userCredits}</span>
            <span className="text-sm text-muted-foreground">| Maliyet: 35 kredi</span>
          </div>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Avuç İçi Fotoğrafı Yükleyin</CardTitle>
              <CardDescription>
                Sol veya sağ elinizin avuç içini net bir şekilde çekin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {handImage ? (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={handImage}
                    alt="Hand palm"
                    className="w-full rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setHandImage("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square max-w-md mx-auto border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <Hand className="w-16 h-16 text-muted-foreground mb-4" />
                  <span className="text-lg font-medium mb-2">Avuç İçi Fotoğrafı Yükle</span>
                  <span className="text-sm text-muted-foreground">Tıklayın veya sürükleyin</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}

              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">📸 Fotoğraf İpuçları:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Avuç içinizi düz ve açık tutun</li>
                  <li>• Aydınlık bir ortamda çekin</li>
                  <li>• Çizgilerin net görünmesine dikkat edin</li>
                  <li>• Gölge oluşturmamaya özen gösterin</li>
                  <li>• Fotoğrafı yukarıdan çekin</li>
                </ul>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!handImage || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>Elimi Oku (35 Kredi)</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🤲 El Okuma Sonucu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.life_line && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">❤️ Hayat Çizgisi:</h3>
                    <p className="whitespace-pre-wrap">{result.life_line}</p>
                  </div>
                )}

                {result.head_line && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🧠 Akıl Çizgisi:</h3>
                    <p className="whitespace-pre-wrap">{result.head_line}</p>
                  </div>
                )}

                {result.heart_line && (
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💕 Kalp Çizgisi:</h3>
                    <p className="whitespace-pre-wrap">{result.heart_line}</p>
                  </div>
                )}

                {result.fate_line && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🌟 Kader Çizgisi:</h3>
                    <p className="whitespace-pre-wrap">{result.fate_line}</p>
                  </div>
                )}

                {result.personality && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🎭 Kişilik Analizi:</h3>
                    <p className="whitespace-pre-wrap">{result.personality}</p>
                  </div>
                )}

                {result.career && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💼 Kariyer ve Yetenek:</h3>
                    <p className="whitespace-pre-wrap">{result.career}</p>
                  </div>
                )}

                {result.relationships && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💑 İlişkiler:</h3>
                    <p className="whitespace-pre-wrap">{result.relationships}</p>
                  </div>
                )}

                {result.health && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🏥 Sağlık:</h3>
                    <p className="whitespace-pre-wrap">{result.health}</p>
                  </div>
                )}

                {result.future && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🔮 Gelecek İşaretleri:</h3>
                    <p className="whitespace-pre-wrap">{result.future}</p>
                  </div>
                )}

                {result.special_marks && result.special_marks.length > 0 && (
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">✨ Özel İşaretler:</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {result.special_marks.map((mark: any, index: number) => (
                        <div key={index} className="p-3 bg-background rounded">
                          <div className="font-semibold">{mark.mark}</div>
                          <div className="text-sm text-muted-foreground">{mark.location}</div>
                          <div className="text-sm mt-1">{mark.meaning}</div>
                        </div>
                      ))}
                    </div>
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

                <Button onClick={() => { setResult(null); setHandImage(""); }} className="w-full">
                  Yeni Okuma Yap
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Palmistry;