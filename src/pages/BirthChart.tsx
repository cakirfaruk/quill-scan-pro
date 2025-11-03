import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { PersonSelector } from "@/components/PersonSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { getAllPlanets } from "ephemeris";

const birthChartTopics = [
  "Güneş Burcu (Kişilik)",
  "Ay Burcu (Duygular)",
  "Yükselen Burcu (Dış Görünüm)",
  "Merkür (İletişim)",
  "Venüs (Aşk & İlişkiler)",
  "Mars (Enerji & Tutku)",
  "Jüpiter (Büyüme & Şans)",
  "Satürn (Sorumluluk & Dersler)",
  "Uranüs (Değişim & Yenilik)",
  "Neptün (Rüyalar & Sezgi)",
  "Plüton (Dönüşüm & Güç)",
  "Evler (Yaşam Alanları)",
];

const BirthChart = () => {
  const [personData, setPersonData] = useState<{
    fullName?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
  }>({});
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadCredits();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Giriş Gerekli",
        description: "Doğum haritası analizi için giriş yapmanız gerekiyor.",
        variant: "destructive",
      });
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
        setCredits(profile.credits);
      }
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics([...birthChartTopics]);
    }
    setSelectAll(!selectAll);
  };

  const calculateBirthChart = async (birthDate: string, birthTime: string, birthPlace: string) => {
    try {
      // Get coordinates from Google Maps API
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(birthPlace)}&key=AIzaSyCONL709dmB9jCd3Pd2li5xACFF7qltmSI`
      );
      const geocodeData = await geocodeResponse.json();
      
      let latitude = 40.1917; // Default: Bursa
      let longitude = 29.0610;
      
      if (geocodeData.results && geocodeData.results.length > 0) {
        latitude = geocodeData.results[0].geometry.location.lat;
        longitude = geocodeData.results[0].geometry.location.lng;
      }

      // Combine date and time
      const dateTimeString = `${birthDate}T${birthTime}:00`;
      const birthDateTime = new Date(dateTimeString);

      // Calculate planets using ephemeris
      const result = getAllPlanets(birthDateTime, longitude, latitude, 0);
      const planets = result.observed;

      // Convert to zodiac signs
      const getZodiacSign = (longitude: number) => {
        const signs = [
          "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
          "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"
        ];
        const signIndex = Math.floor(longitude / 30);
        return signs[signIndex];
      };

      const formatDegrees = (longitude: number) => {
        const sign = Math.floor(longitude / 30);
        const degrees = longitude - (sign * 30);
        const deg = Math.floor(degrees);
        const minDecimal = (degrees - deg) * 60;
        const min = Math.floor(minDecimal);
        const sec = Math.floor((minDecimal - min) * 60);
        return `${deg}° ${min}' ${sec}"`;
      };

      const gezegen_burclari = {
        gunes: { burc: getZodiacSign(planets.sun.apparentLongitudeDd), derece: formatDegrees(planets.sun.apparentLongitudeDd) },
        ay: { burc: getZodiacSign(planets.moon.apparentLongitudeDd), derece: formatDegrees(planets.moon.apparentLongitudeDd) },
        merkur: { burc: getZodiacSign(planets.mercury.apparentLongitudeDd), derece: formatDegrees(planets.mercury.apparentLongitudeDd) },
        venus: { burc: getZodiacSign(planets.venus.apparentLongitudeDd), derece: formatDegrees(planets.venus.apparentLongitudeDd) },
        mars: { burc: getZodiacSign(planets.mars.apparentLongitudeDd), derece: formatDegrees(planets.mars.apparentLongitudeDd) },
        jupiter: { burc: getZodiacSign(planets.jupiter.apparentLongitudeDd), derece: formatDegrees(planets.jupiter.apparentLongitudeDd) },
        saturn: { burc: getZodiacSign(planets.saturn.apparentLongitudeDd), derece: formatDegrees(planets.saturn.apparentLongitudeDd) },
        uranus: { burc: getZodiacSign(planets.uranus.apparentLongitudeDd), derece: formatDegrees(planets.uranus.apparentLongitudeDd) },
        neptun: { burc: getZodiacSign(planets.neptune.apparentLongitudeDd), derece: formatDegrees(planets.neptune.apparentLongitudeDd) },
        pluton: { burc: getZodiacSign(planets.pluto.apparentLongitudeDd), derece: formatDegrees(planets.pluto.apparentLongitudeDd) },
      };

      return {
        latitude,
        longitude,
        gezegen_burclari
      };
    } catch (error) {
      console.error("Birth chart calculation error:", error);
      throw error;
    }
  };

  const handleAnalyze = async () => {
    // Check if profile is complete
    const missingFields: string[] = [];
    if (!personData.fullName?.trim()) missingFields.push("Ad Soyad");
    if (!personData.birthDate) missingFields.push("Doğum Tarihi");
    if (!personData.birthTime) missingFields.push("Doğum Saati");
    if (!personData.birthPlace?.trim()) missingFields.push("Doğum Yeri");
    
    if (missingFields.length > 0) {
      toast({
        title: "Eksik Profil Bilgileri",
        description: `Lütfen profil bilgilerinizi eksiksiz doldurun: ${missingFields.join(", ")}. Ayarlar > Profil Düzenle sayfasından bilgilerinizi güncelleyebilirsiniz.`,
        variant: "destructive",
      });
      return;
    }

    if (selectedTopics.length === 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen en az bir konu seçin.",
        variant: "destructive",
      });
      return;
    }

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

    try {
      // Calculate birth chart on client-side
      const chartData = await calculateBirthChart(
        personData.birthDate!,
        personData.birthTime!,
        personData.birthPlace!
      );

      const { data, error } = await supabase.functions.invoke("analyze-birth-chart", {
        body: {
          fullName: personData.fullName,
          birthDate: personData.birthDate,
          birthTime: personData.birthTime,
          birthPlace: personData.birthPlace,
          selectedTopics,
          chartData, // Send calculated chart data
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data);
      await loadCredits();

      toast({
        title: "Analiz Tamamlandı",
        description: "Doğum haritası analizi başarıyla tamamlandı.",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analiz Hatası",
        description: error.message || "Analiz sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPersonData({});
    setSelectedTopics([]);
    setAnalysisResult(null);
    setSelectAll(false);
  };

  if (analysisResult) {
    const analysisData = analysisResult.analiz || analysisResult;
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Doğum Haritası Analiz Sonuçları</CardTitle>
              <CardDescription>
                {analysisData.isim || personData.fullName} - {analysisData.dogum_tarihi || personData.birthDate} {analysisData.dogum_saati || personData.birthTime} - {analysisData.dogum_yeri || personData.birthPlace}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisDetailView result={analysisData} analysisType="birth_chart" />
              <Button onClick={handleReset} className="w-full mt-6">Yeni Analiz Yap</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Astrolojik Doğum Haritası Analizi</CardTitle>
            <CardDescription>
              Doğum bilgilerinizi girin ve astrolojik haritanızı keşfedin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <PersonSelector
              label="Kimin İçin Analiz Yapılacak?"
              personData={personData}
              onChange={setPersonData}
              requiredFields={{
                fullName: true,
                birthDate: true,
                birthTime: true,
                birthPlace: true,
                gender: false,
              }}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Analiz Konularını Seçin</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedTopics.length} / {birthChartTopics.length} seçildi
                  </span>
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {selectAll ? "Hiçbirini Seçme" : "Tümünü Seç"}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
                {birthChartTopics.map((topic) => (
                  <div
                    key={topic}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTopics.includes(topic)
                        ? "bg-primary/10 border-primary"
                        : "bg-card hover:bg-accent"
                    }`}
                    onClick={() => toggleTopic(topic)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      className="cursor-pointer"
                    />
                    <Label className="cursor-pointer flex-1">{topic}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Toplam Maliyet</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTopics.length} konu × 1 kredi = {selectedTopics.length} kredi
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Mevcut Kredi</p>
                <p className="text-2xl font-bold text-primary">{credits}</p>
              </div>
            </div>

            {selectedTopics.length > credits && (
              <div className="text-sm text-destructive">
                Yetersiz kredi. Analiz için {selectedTopics.length - credits} kredi daha gerekiyor.
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing || 
                selectedTopics.length === 0 || 
                selectedTopics.length > credits ||
                !personData.fullName ||
                !personData.birthDate ||
                !personData.birthTime ||
                !personData.birthPlace
              }
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                "Analizi Başlat"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BirthChart;
