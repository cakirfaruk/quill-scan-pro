import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PersonSelector } from "@/components/PersonSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { ShareAnalysisButton } from "@/components/ShareAnalysisButton";
import { getAllPlanets } from "ephemeris";
import { motion } from "framer-motion";

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
  "Chiron (Yaralı İyileştirici)",
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
  const [analysisId, setAnalysisId] = useState<string | null>(null);
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
      console.log("Starting birth chart calculation...", { birthDate, birthTime, birthPlace });

      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(birthPlace)}&limit=1`,
        { headers: { "User-Agent": "AstroSocial/1.0" } }
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData || geocodeData.length === 0) {
        throw new Error("Doğum yeri bulunamadı. Lütfen il veya ilçe adı girerek tekrar deneyin.");
      }

      const latitude = parseFloat(geocodeData[0].lat);
      const longitude = parseFloat(geocodeData[0].lon);

      const timeWithSeconds = birthTime.includes(':') && birthTime.split(':').length === 2
        ? `${birthTime}:00`
        : birthTime;

      const dateTimeString = `${birthDate}T${timeWithSeconds}`;
      const birthDateTime = new Date(dateTimeString);

      if (isNaN(birthDateTime.getTime())) {
        throw new Error("Geçersiz tarih formatı.");
      }

      const result = getAllPlanets(birthDateTime, longitude, latitude, 0);

      if (!result || !result.observed) {
        throw new Error("Gezegen konumları hesaplanamadı.");
      }

      const planets = result.observed;

      const getZodiacSign = (eclipticLongitude: number) => {
        const signs = [
          "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
          "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"
        ];
        const signIndex = Math.floor(eclipticLongitude / 30);
        return signs[signIndex];
      };

      const formatDegrees = (eclipticLongitude: number) => {
        const sign = Math.floor(eclipticLongitude / 30);
        const degrees = eclipticLongitude - (sign * 30);
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
        chiron: { burc: getZodiacSign(planets.chiron.apparentLongitudeDd), derece: formatDegrees(planets.chiron.apparentLongitudeDd) },
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
    const missingFields: string[] = [];
    if (!personData.fullName?.trim()) missingFields.push("Ad Soyad");
    if (!personData.birthDate) missingFields.push("Doğum Tarihi");
    if (!personData.birthTime) missingFields.push("Doğum Saati");
    if (!personData.birthPlace?.trim()) missingFields.push("Doğum Yeri");

    if (missingFields.length > 0) {
      toast({
        title: "Eksik Bilgiler",
        description: `Lütfen şu alanları doldurun: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedTopics.length === 0) {
      toast({
        title: "Konu Seçilmedi",
        description: "Lütfen analiz edilecek en az bir konu seçin.",
        variant: "destructive",
      });
      return;
    }

    if (credits < selectedTopics.length) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu analiz için ${selectedTopics.length} kredi gerekiyor. Bakiyeniz: ${credits}`,
        variant: "destructive",
      });
      // Optionally navigate to credits page
      return;
    }

    setIsAnalyzing(true);

    try {
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
          chartData,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysisResult(data);
      if (data.id) setAnalysisId(data.id);
      await loadCredits();

      toast({
        title: "Analiz Hazır ✨",
        description: "Yıldızların mesajı başarıyla çözümlendi.",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Hata",
        description: error.message || "Analiz sırasında bir sorun oluştu.",
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
    setAnalysisId(null);
    setSelectAll(false);
  };

  if (analysisResult) {
    const analysisData = analysisResult.analiz || analysisResult;
    return (
      <div className="min-h-screen bg-transparent pb-28">
        <PageHeader
          title="Analiz Sonucu"
          showBack
          action={
            analysisId && (
              <ShareAnalysisButton
                analysisId={analysisId}
                analysisType="birth_chart"
                analysisTitle="Doğum Haritası"
                variant="ghost"
                size="icon"
              />
            )
          }
        />

        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-none text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-24 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />

              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-2xl shadow-glow">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      {analysisData.isim || personData.fullName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                      <span>{analysisData.dogum_tarihi || personData.birthDate}</span>
                      <span>•</span>
                      <span>{analysisData.dogum_yeri || personData.birthPlace}</span>
                    </div>
                  </div>
                </div>

                <AnalysisDetailView result={analysisData} analysisType="birth_chart" />

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full mt-8 border-white/10 hover:bg-white/5 text-white hover:text-primary transition-all duration-300"
                >
                  Yeni Analiz Yap
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-accent/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <PageHeader
        title="Doğum Haritası"
        description="Kozmik potansiyelini keşfet"
        showBack
      />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card border-white/10 bg-black/40 text-white shadow-glass">
            <CardContent className="p-6 space-y-8">

              {/* Person Data Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <h3 className="font-semibold text-lg tracking-tight">Kişisel Bilgiler</h3>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <PersonSelector
                    label="Kimin İçin?"
                    personData={personData}
                    onChange={setPersonData}
                    requiredFields={{
                      fullName: true,
                      birthDate: true,
                      birthTime: true,
                      birthPlace: true,
                      gender: false,
                    }}
                    className="space-y-4"
                    inputClassName="bg-black/20 border-white/10 focus:border-primary/50 text-white placeholder:text-white/20 input-glow h-12 rounded-xl"
                    labelClassName="text-white/60 text-xs uppercase tracking-wider font-medium ml-1"
                  />
                </div>
              </div>

              {/* Topics Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <Label className="text-lg font-semibold text-white tracking-tight">Analiz Başlıkları</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/5">
                      {selectedTopics.length}/{birthChartTopics.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAll}
                      className="text-xs h-7 px-3 text-primary hover:text-primary-glow hover:bg-primary/10 rounded-full transition-colors"
                    >
                      {selectAll ? "Temizle" : "Tümünü Seç"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-1">
                  {birthChartTopics.map((topic) => (
                    <motion.div
                      key={topic}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ scale: 1.02 }}
                      className={`
                                relative overflow-hidden flex items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group
                                ${selectedTopics.includes(topic)
                          ? "bg-primary/20 border-primary/50 text-white shadow-neon"
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20"
                        }
                            `}
                      onClick={() => toggleTopic(topic)}
                    >
                      {selectedTopics.includes(topic) && (
                        <motion.div
                          layoutId="active-glow"
                          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-sm"
                        />
                      )}
                      <span className="z-10 text-sm font-medium relative">{topic}</span>
                      {selectedTopics.includes(topic) && (
                        <div className="absolute right-3 z-10 text-primary">
                          <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Credits & Action */}
              <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="font-medium text-white">Toplam Maliyet</p>
                    <p className="text-xs text-white/40">
                      {selectedTopics.length} konu seçildi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Mevcut Bakiyeniz</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {credits}
                      </span>
                      <span className="text-sm text-white/60">kredi</span>
                    </div>
                  </div>
                </div>

                {selectedTopics.length > credits && (
                  <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-pulse">
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
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      <span className="animate-pulse">Evrenin Sırları Çözülüyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>Kozmik Analizi Başlat</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BirthChart;
