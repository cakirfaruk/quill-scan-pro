import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadZone } from "@/components/UploadZone";
import { PersonSelector } from "@/components/PersonSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, User, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CompatibilityResult {
  person1Analysis: string;
  person2Analysis: string;
  compatibilityAreas: Array<{
    name: string;
    person1Finding: string;
    person2Finding: string;
    compatibilityScore: number;
    strengths: string;
    challenges: string;
    recommendations: string;
  }>;
  overallScore: number;
  overallSummary: string;
}

const Compatibility = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [person1Data, setPerson1Data] = useState<{
    fullName?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    gender?: string;
  }>({ gender: "male" });
  
  const [file2, setFile2] = useState<File | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [person2Data, setPerson2Data] = useState<{
    fullName?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    gender?: string;
  }>({ gender: "female" });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [credits, setCredits] = useState(0);
  
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<string[]>(["handwriting"]);
  
  const analysisTypes = [
    { id: "handwriting", name: "El Yazısı Analizi", cost: 50 },
    { id: "numerology", name: "Numeroloji Analizi", cost: 50 },
    { id: "birth_chart", name: "Doğum Haritası Analizi", cost: 50 },
  ];
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadCredits();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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

  const toggleAnalysisType = (typeId: string) => {
    setSelectedAnalysisTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const getTotalCost = () => {
    return selectedAnalysisTypes.length * 50;
  };

  const validateInputs = () => {
    const needsHandwriting = selectedAnalysisTypes.includes("handwriting");
    const needsNumerology = selectedAnalysisTypes.includes("numerology");
    const needsBirthChart = selectedAnalysisTypes.includes("birth_chart");

    // El yazısı seçiliyse dosya zorunlu
    if (needsHandwriting && (!file1 || !file2)) {
      return "El yazısı analizi için her iki kişinin de yazı örneği gerekli.";
    }

    // Numeroloji seçiliyse isim ve doğum tarihi zorunlu
    if (needsNumerology) {
      const missingFields1: string[] = [];
      const missingFields2: string[] = [];
      
      if (!person1Data.fullName) missingFields1.push("Ad Soyad");
      if (!person1Data.birthDate) missingFields1.push("Doğum Tarihi");
      if (!person2Data.fullName) missingFields2.push("Ad Soyad");
      if (!person2Data.birthDate) missingFields2.push("Doğum Tarihi");
      
      if (missingFields1.length > 0) {
        return `Birinci kişi için eksik bilgiler: ${missingFields1.join(", ")}. Lütfen Ayarlar > Profil Düzenle sayfasından profil bilgilerinizi güncelleyin.`;
      }
      if (missingFields2.length > 0) {
        return `İkinci kişi için eksik bilgiler: ${missingFields2.join(", ")}.`;
      }
    }

    // Doğum haritası seçiliyse tüm bilgiler zorunlu
    if (needsBirthChart) {
      const missingFields1: string[] = [];
      const missingFields2: string[] = [];
      
      if (!person1Data.fullName) missingFields1.push("Ad Soyad");
      if (!person1Data.birthDate) missingFields1.push("Doğum Tarihi");
      if (!person1Data.birthTime) missingFields1.push("Doğum Saati");
      if (!person1Data.birthPlace) missingFields1.push("Doğum Yeri");
      
      if (!person2Data.fullName) missingFields2.push("Ad Soyad");
      if (!person2Data.birthDate) missingFields2.push("Doğum Tarihi");
      if (!person2Data.birthTime) missingFields2.push("Doğum Saati");
      if (!person2Data.birthPlace) missingFields2.push("Doğum Yeri");
      
      if (missingFields1.length > 0) {
        return `Birinci kişi için eksik bilgiler: ${missingFields1.join(", ")}. Lütfen Ayarlar > Profil Düzenle sayfasından profil bilgilerinizi güncelleyin.`;
      }
      if (missingFields2.length > 0) {
        return `İkinci kişi için eksik bilgiler: ${missingFields2.join(", ")}.`;
      }
    }

    return null;
  };

  const handleAnalyze = async () => {
    if (selectedAnalysisTypes.length === 0) return;

    const validationError = validateInputs();
    if (validationError) {
      toast({
        title: "Eksik bilgi",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const totalCost = getTotalCost();
    
    if (credits < totalCost) {
      toast({
        title: "Yetersiz kredi",
        description: `Bu analiz için ${totalCost} kredi gerekli. Mevcut krediniz: ${credits}`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const reader1 = new FileReader();
      const reader2 = new FileReader();

      const base64Promise1 = new Promise<string>((resolve) => {
        reader1.onload = () => resolve(reader1.result as string);
      });
      const base64Promise2 = new Promise<string>((resolve) => {
        reader2.onload = () => resolve(reader2.result as string);
      });

      let image1 = null;
      let image2 = null;

      // Sadece el yazısı analizi seçiliyse dosyaları oku
      if (selectedAnalysisTypes.includes("handwriting")) {
        reader1.readAsDataURL(file1!);
        reader2.readAsDataURL(file2!);
        [image1, image2] = await Promise.all([base64Promise1, base64Promise2]);
      }

      const { data, error } = await supabase.functions.invoke("analyze-compatibility", {
        body: { 
          image1, 
          image2, 
          gender1: person1Data.gender || "male", 
          gender2: person2Data.gender || "female",
          name1: person1Data.fullName,
          birthDate1: person1Data.birthDate,
          birthTime1: person1Data.birthTime,
          birthPlace1: person1Data.birthPlace,
          name2: person2Data.fullName,
          birthDate2: person2Data.birthDate,
          birthTime2: person2Data.birthTime,
          birthPlace2: person2Data.birthPlace,
          analysisTypes: selectedAnalysisTypes,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      await loadCredits();

      toast({
        title: "Uyum analizi tamamlandı",
        description: "Sonuçları aşağıda inceleyebilirsiniz.",
      });
    } catch (error: any) {
      toast({
        title: "Analiz hatası",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile1(null);
    setPreview1(null);
    setFile2(null);
    setPreview2(null);
    setPerson1Data({ gender: "male" });
    setPerson2Data({ gender: "female" });
    setResult(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Uyum Analizi Sonuçları</h2>
              <p className="text-muted-foreground mt-2">İki kişi arasındaki uyum değerlendirmesi</p>
            </div>
            <Button onClick={handleReset} variant="outline">
              Yeni Analiz
            </Button>
          </div>

          <Card className="p-8 mb-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-2 border-primary/20">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-primary rounded-full">
                <Heart className="w-12 h-12 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-4xl font-bold text-primary mb-2">
                  %{result.overallScore} Uyum
                </h3>
                <Progress value={result.overallScore} className="h-3 mt-4" />
              </div>
              <p className="text-lg leading-relaxed text-foreground">
                {result.overallSummary}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {person1Data.gender === "male" ? "Erkek" : "Kadın"} - Kişilik Analizi
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.person1Analysis}
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                {person2Data.gender === "male" ? "Erkek" : "Kadın"} - Kişilik Analizi
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.person2Analysis}
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Uyum Alanları</h3>
            {result.compatibilityAreas.map((area, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-foreground">{area.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">%{area.compatibilityScore}</span>
                    <Progress value={area.compatibilityScore} className="w-24 h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      {person1Data.gender === "male" ? "Erkek" : "Kadın"}
                    </p>
                    <p className="text-sm text-foreground/80">{area.person1Finding}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      {person2Data.gender === "male" ? "Erkek" : "Kadın"}
                    </p>
                    <p className="text-sm text-foreground/80">{area.person2Finding}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-success uppercase mb-1">Güçlü Yanlar</p>
                    <p className="text-sm text-foreground">{area.strengths}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-warning uppercase mb-1">Potansiyel Zorluklar</p>
                    <p className="text-sm text-foreground">{area.challenges}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase mb-1">Öneriler</p>
                    <p className="text-sm text-foreground">{area.recommendations}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-primary rounded-full mb-4">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Uyum Analizi
          </h1>
          <p className="text-lg text-muted-foreground">
            İki kişi arasındaki uyumu farklı analiz yöntemleriyle değerlendirin
          </p>
        </div>

        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Analiz Türlerini Seçin</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Her analiz türü 50 kredi. İstediğiniz türleri seçebilirsiniz.
          </p>
          <div className="space-y-3">
            {analysisTypes.map((type) => (
              <div
                key={type.id}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnalysisTypes.includes(type.id)
                    ? "bg-primary/10 border-primary"
                    : "bg-card hover:bg-accent"
                }`}
                onClick={() => toggleAnalysisType(type.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedAnalysisTypes.includes(type.id)}
                    onChange={() => toggleAnalysisType(type.id)}
                    className="cursor-pointer"
                  />
                  <Label className="cursor-pointer font-semibold">{type.name}</Label>
                </div>
                <span className="text-primary font-bold">{type.cost} kredi</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">Toplam Maliyet</p>
              <p className="text-sm text-muted-foreground">
                {selectedAnalysisTypes.length} analiz türü × 50 kredi
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{getTotalCost()} kredi</p>
              <p className="text-sm text-muted-foreground">Mevcut: {credits} kredi</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Person 1 */}
          <div className="space-y-6">
            <PersonSelector
              label="Birinci Kişi"
              personData={person1Data}
              onChange={setPerson1Data}
              requiredFields={{
                fullName: selectedAnalysisTypes.includes("numerology") || selectedAnalysisTypes.includes("birth_chart"),
                birthDate: selectedAnalysisTypes.includes("numerology") || selectedAnalysisTypes.includes("birth_chart"),
                birthTime: selectedAnalysisTypes.includes("birth_chart"),
                birthPlace: selectedAnalysisTypes.includes("birth_chart"),
                gender: true,
              }}
            />

            {selectedAnalysisTypes.includes("handwriting") && (
              <Card className="p-6">
                <Label className="mb-3 block">El Yazısı Örneği</Label>
                {!file1 ? (
                  <UploadZone onFileSelect={(file, preview) => { setFile1(file); setPreview1(preview); }} />
                ) : (
                  <div className="space-y-4">
                    {preview1 === "pdf" ? (
                      <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                        <FileText className="w-12 h-12 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">{file1.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file1.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <img src={preview1} alt="Birinci yazı" className="w-full h-48 object-contain bg-muted rounded-lg" />
                    )}
                    <Button variant="outline" onClick={() => { setFile1(null); setPreview1(null); }}>
                      Değiştir
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Person 2 */}
          <div className="space-y-6">
            <PersonSelector
              label="İkinci Kişi"
              personData={person2Data}
              onChange={setPerson2Data}
              requiredFields={{
                fullName: selectedAnalysisTypes.includes("numerology") || selectedAnalysisTypes.includes("birth_chart"),
                birthDate: selectedAnalysisTypes.includes("numerology") || selectedAnalysisTypes.includes("birth_chart"),
                birthTime: selectedAnalysisTypes.includes("birth_chart"),
                birthPlace: selectedAnalysisTypes.includes("birth_chart"),
                gender: true,
              }}
            />

            {selectedAnalysisTypes.includes("handwriting") && (
              <Card className="p-6">
                <Label className="mb-3 block">El Yazısı Örneği</Label>
                {!file2 ? (
                  <UploadZone onFileSelect={(file, preview) => { setFile2(file); setPreview2(preview); }} />
                ) : (
                  <div className="space-y-4">
                    {preview2 === "pdf" ? (
                      <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                        <FileText className="w-12 h-12 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">{file2.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file2.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <img src={preview2} alt="İkinci yazı" className="w-full h-48 object-contain bg-muted rounded-lg" />
                    )}
                    <Button variant="outline" onClick={() => { setFile2(null); setPreview2(null); }}>
                      Değiştir
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || credits < getTotalCost() || selectedAnalysisTypes.length === 0}
            className="bg-gradient-primary hover:opacity-90 px-12"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analiz ediliyor...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-5 w-5" />
                Uyum Analizini Başlat ({getTotalCost()} kredi)
              </>
            )}
          </Button>

          {credits < getTotalCost() && (
            <p className="text-sm text-destructive mt-4">
              Yetersiz kredi! Bu analiz için {getTotalCost()} kredi gerekli.
            </p>
          )}
          
          {selectedAnalysisTypes.length === 0 && (
            <p className="text-sm text-destructive mt-4">
              Lütfen en az bir analiz türü seçin.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Compatibility;