import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Star, Heart, Briefcase, DollarSign, Activity } from "lucide-react";

const DailyHoroscope = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);

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

  const handleGenerate = async () => {
    if (userCredits < 10 && !alreadyGenerated) {
      toast.error("Yetersiz kredi. Lütfen kredi satın alın.");
      navigate("/credits");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-daily-horoscope', {
        body: {},
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      setResult(data.interpretation);
      setAlreadyGenerated(data.alreadyExists || false);
      if (!data.alreadyExists) {
        setUserCredits(prev => prev - 10);
      }
      toast.success(data.alreadyExists ? "Bugünkü falınız yüklendi!" : "Günlük falınız hazır!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Oluşturma sırasında hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-background to-background dark:from-violet-950/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            🌟 Günlük Kehanet
          </h1>
          <p className="text-muted-foreground">
            Bugün sizin için neler var? Hemen öğrenin!
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Mevcut Kredi:</span>
            <span className="font-bold text-lg">{userCredits}</span>
            <span className="text-sm text-muted-foreground">| Maliyet: 10 kredi</span>
          </div>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Günlük Falınızı Alın</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Star className="w-16 h-16 mx-auto mb-4 text-violet-600" />
                <p className="text-lg mb-6">
                  Her gün sizin için özel olarak hazırlanmış kişisel kehanet
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6 max-w-md mx-auto text-left">
                  <li>✨ Genel enerji ve ruh hali</li>
                  <li>💕 Aşk ve ilişkiler</li>
                  <li>💼 Kariyer ve iş fırsatları</li>
                  <li>💰 Para ve finans</li>
                  <li>🏥 Sağlık önerileri</li>
                  <li>🍀 Şanslı sayı ve renk</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Günlük Falımı Al (10 Kredi)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-violet-600" />
                  Bugünkü Falınız
                </CardTitle>
                {alreadyGenerated && (
                  <p className="text-sm text-muted-foreground">
                    Bugün zaten falınızı almıştınız. Yarın yeni bir fal alabilirsiniz.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {result.general && (
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Genel Enerji:
                    </h3>
                    <p className="whitespace-pre-wrap">{result.general}</p>
                  </div>
                )}

                {result.love && (
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Aşk ve İlişkiler:
                    </h3>
                    <p className="whitespace-pre-wrap">{result.love}</p>
                  </div>
                )}

                {result.career && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Kariyer:
                    </h3>
                    <p className="whitespace-pre-wrap">{result.career}</p>
                  </div>
                )}

                {result.money && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Para:
                    </h3>
                    <p className="whitespace-pre-wrap">{result.money}</p>
                  </div>
                )}

                {result.health && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Sağlık:
                    </h3>
                    <p className="whitespace-pre-wrap">{result.health}</p>
                  </div>
                )}

                {(result.lucky_number || result.lucky_color) && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">🍀 Şanslı Öğeler:</h3>
                    <div className="flex gap-4">
                      {result.lucky_number && (
                        <div>
                          <span className="font-semibold">Sayı:</span> {result.lucky_number}
                        </div>
                      )}
                      {result.lucky_color && (
                        <div>
                          <span className="font-semibold">Renk:</span> {result.lucky_color}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.advice && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💡 Günün Tavsiyesi:</h3>
                    <p className="whitespace-pre-wrap">{result.advice}</p>
                  </div>
                )}

                {result.raw && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{result.raw}</p>
                  </div>
                )}

                <div className="pt-4 text-center text-sm text-muted-foreground">
                  Yarın yeni bir fal için geri gelin! 🌟
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyHoroscope;