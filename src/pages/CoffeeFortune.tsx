import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoCaptureEditor } from "@/components/PhotoCaptureEditor";
import { toast } from "sonner";
import { Upload, X, Sparkles, Camera } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { logError } from "@/utils/analytics";

const CoffeeFortune = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fotoğraf boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoCapture = (imageData: string) => {
    const newImages = [...images];
    newImages[currentImageIndex] = imageData;
    setImages(newImages);
  };

  const openPhotoEditor = (index: number) => {
    setCurrentImageIndex(index);
    setShowPhotoEditor(true);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = "";
    setImages(newImages);
  };

  const handleAnalyze = async () => {
    if (images.filter(img => img).length !== 3) {
      toast.error("Lütfen 3 fotoğraf yükleyin");
      return;
    }

    if (userCredits < 40) {
      toast.error("Yetersiz kredi. Lütfen kredi satın alın.");
      navigate("/credits");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('analyze-coffee-fortune', {
        body: { 
          image1: images[0],
          image2: images[1],
          image3: images[2]
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data.interpretation);
      setUserCredits(prev => prev - 40);
      toast.success("Kahve falınız hazır!");
    } catch (error: any) {
      console.error("Coffee fortune analysis error:", error);
      
      const errorMessage = error.message || "Analiz sırasında hata oluştu";
      
      logError(
        'Kahve falı analizi hatası',
        error.stack,
        'CoffeeFortuneError',
        'error',
        { hasImages: images.filter(Boolean).length }
      );
      
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-background to-background dark:from-amber-950/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            ☕ Kahve Falı
          </h1>
          <p className="text-muted-foreground">
            Fincanınızın 3 farklı açıdan fotoğrafını çekin
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Mevcut Kredi:</span>
            <span className="font-bold text-lg">{userCredits}</span>
            <span className="text-sm text-muted-foreground">| Maliyet: 40 kredi</span>
          </div>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Fincan Fotoğraflarını Yükleyin</CardTitle>
              <CardDescription>
                Her açıdan net ve aydınlık fotoğraflar çekin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm font-medium">
                      {index === 0 && "Ana Görünüm"}
                      {index === 1 && "Yan Görünüm"}
                      {index === 2 && "Tabak Görünümü"}
                    </label>
                    {images[index] ? (
                      <div className="relative aspect-square">
                        <img
                          src={images[index]}
                          alt={`Coffee cup ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={() => openPhotoEditor(index)}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <Camera className="w-4 h-4" />
                          Kamera ile Çek
                        </Button>
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">veya Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, index)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">📸 Fotoğraf İpuçları:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Aydınlık bir ortamda çekin</li>
                  <li>• Fincanın içini net gösterin</li>
                  <li>• Gölge oluşturmamaya dikkat edin</li>
                  <li>• Her açıyı farklı bir perspektiften çekin</li>
                </ul>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={images.filter(img => img).length !== 3 || isAnalyzing}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Falınız Bakılıyor...
                  </>
                ) : (
                  <>Fala Bak (40 Kredi)</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>☕ Kahve Falı Sonucu</CardTitle>
                <CardDescription>Fincanınız yorumlandı</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalysisDetailView result={result} analysisType="coffee_fortune" />
                
                <Button onClick={() => { setResult(null); setImages([]); }} className="w-full mt-6">
                  Yeni Fal Baktır
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <PhotoCaptureEditor
        open={showPhotoEditor}
        onOpenChange={setShowPhotoEditor}
        onCapture={handlePhotoCapture}
        title="Kahve Fincanı Fotoğrafı"
        description="Fincanınızın net bir fotoğrafını çekin"
      />
    </div>
  );
};

export default CoffeeFortune;