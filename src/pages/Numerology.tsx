import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { PersonSelector } from "@/components/PersonSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { z } from "zod";
import { logError } from "@/utils/analytics";

const numerologySchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, "İsim en az 2 karakter olmalı")
    .max(100, "İsim çok uzun")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "İsim sadece harf içerebilir"),
  birthDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Geçerli bir tarih girin")
    .refine((date) => new Date(date) <= new Date(), "Doğum tarihi gelecekte olamaz"),
});

const allTopics = [
  { name: "Kader Rakamı (Yaşam Yolu Sayısı)", badge: "Popüler", color: "bg-blue-500/10 text-blue-500" },
  { name: "İsim Analizi ve Dokuzlu Vefk", badge: "Popüler", color: "bg-blue-500/10 text-blue-500" },
  { name: "Doğum Tarihi Numerolojisi", badge: "Hızlı", color: "bg-green-500/10 text-green-500" },
  { name: "Yaşam Döngüleri (0-28, 29-56, 56+)", badge: "Detaylı", color: "bg-purple-500/10 text-purple-500" },
  { name: "Zirve Döngüsü Rakamları", badge: "Hızlı", color: "bg-green-500/10 text-green-500" },
  { name: "Ruhun Arzusu Rakamı", badge: "Popüler", color: "bg-blue-500/10 text-blue-500" },
  { name: "Kişisel Rakam (Dış Dünya İlişkisi)", badge: "Hızlı", color: "bg-green-500/10 text-green-500" },
  { name: "Kemal (Olgunluk) Rakamı", badge: "Detaylı", color: "bg-purple-500/10 text-purple-500" },
  { name: "Karmik Borç Rakamı", badge: "Detaylı", color: "bg-purple-500/10 text-purple-500" },
  { name: "Dominant Rakamlar", badge: "Hızlı", color: "bg-green-500/10 text-green-500" },
  { name: "Şanslı ve Şanssız Rakamlar", badge: "Hızlı", color: "bg-green-500/10 text-green-500" },
  { name: "Kişisel Döngüler ve Evrensel Döngüler", badge: "Detaylı", color: "bg-purple-500/10 text-purple-500" },
  { name: "1-9 Arası Rakamların Ezoterik Anlamları", badge: "Detaylı", color: "bg-purple-500/10 text-purple-500" },
];

const topicPackages = [
  { name: "Temel Analiz", topics: ["Kader Rakamı (Yaşam Yolu Sayısı)", "İsim Analizi ve Dokuzlu Vefk", "Doğum Tarihi Numerolojisi", "Ruhun Arzusu Rakamı", "Kişisel Rakam (Dış Dünya İlişkisi)"], credits: 5 },
  { name: "Detaylı Analiz", topics: ["Kader Rakamı (Yaşam Yolu Sayısı)", "İsim Analizi ve Dokuzlu Vefk", "Yaşam Döngüleri (0-28, 29-56, 56+)", "Ruhun Arzusu Rakamı", "Kemal (Olgunluk) Rakamı", "Karmik Borç Rakamı", "Dominant Rakamlar", "1-9 Arası Rakamların Ezoterik Anlamları"], credits: 8 },
];

export default function Numerology() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [personData, setPersonData] = useState<{ fullName?: string; birthDate?: string; }>({ fullName: "", birthDate: "" });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) setAvailableCredits(data.credits);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(allTopics.map(t => t.name));
    }
    setSelectAll(!selectAll);
  };

  const selectPackage = (packageTopics: string[]) => {
    setSelectedTopics(packageTopics);
    setSelectAll(false);
  };

  const handleAnalyze = async () => {
    // Check if profile is complete when using "myself" option
    const missingFields: string[] = [];
    if (!personData.fullName?.trim()) missingFields.push("Ad Soyad");
    if (!personData.birthDate) missingFields.push("Doğum Tarihi");
    
    if (missingFields.length > 0) {
      toast({
        title: "Eksik Profil Bilgileri",
        description: `Lütfen profil bilgilerinizi eksiksiz doldurun: ${missingFields.join(", ")}. Ayarlar > Profil Düzenle sayfasından bilgilerinizi güncelleyebilirsiniz.`,
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    const validation = numerologySchema.safeParse({
      fullName: personData.fullName,
      birthDate: personData.birthDate,
    });
    
    if (!validation.success) {
      toast({
        title: "Geçersiz Veri",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (selectedTopics.length === 0) {
      toast({
        title: "Konu Seçilmedi",
        description: "Lütfen en az bir analiz konusu seçin.",
        variant: "destructive",
      });
      return;
    }

    const requiredCredits = selectedTopics.length;
    if (availableCredits < requiredCredits) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu analiz için ${requiredCredits} kredi gerekiyor. Mevcut krediniz: ${availableCredits}`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    const estimatedTime = selectedTopics.length <= 3 ? "20-30" : selectedTopics.length <= 5 ? "30-45" : selectedTopics.length <= 8 ? "45-60" : "60-120";
    toast({
      title: "Analiz Başlatıldı",
      description: `Analiz ediliyor, bu işlem ${estimatedTime} saniye sürebilir...`,
    });
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-numerology", {
        body: { fullName: personData.fullName, birthDate: personData.birthDate, selectedTopics },
      });

      if (error) {
        console.error('Numerology analysis error:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data.result);
      setAvailableCredits((prev) => prev - requiredCredits);
      
      toast({
        title: "Analiz Tamamlandı",
        description: `${requiredCredits} kredi kullanıldı.`,
      });
    } catch (error: any) {
      console.error('Numerology analysis error:', error);
      
      const errorMessage = error.message || "Analiz sırasında bir hata oluştu.";
      
      logError(
        'Numeroloji analizi hatası',
        error.stack,
        'NumerologyAnalysisError',
        'error',
        { 
          fullName: personData.fullName, 
          birthDate: personData.birthDate, 
          selectedTopicsCount: selectedTopics.length 
        }
      );
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setPersonData({ fullName: "", birthDate: "" });
    setSelectedTopics([]);
    setSelectAll(false);
  };

  if (analysisResult) {
    const analysisData = analysisResult.analiz || analysisResult;
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Numeroloji Analiz Sonuçları</CardTitle>
              <CardDescription>
                {analysisData.isim || personData.fullName} - {analysisData.dogum_tarihi ? new Date(analysisData.dogum_tarihi).toLocaleDateString("tr-TR") : (personData.birthDate ? new Date(personData.birthDate).toLocaleDateString("tr-TR") : "")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalysisDetailView result={analysisData} analysisType="numerology" />
              <Button onClick={handleReset} className="w-full mt-6">Yeni Analiz Yap</Button>
            </CardContent>
          </Card>
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
            <h1 className="text-4xl font-bold">Numeroloji Analizi</h1>
            <p className="text-muted-foreground">Adınız, doğum tarihiniz ve seçtiğiniz konularla detaylı numeroloji analizi</p>
          </div>

          <PersonSelector
            label="Kimin İçin Analiz Yapılacak?"
            personData={personData}
            onChange={setPersonData}
            requiredFields={{
              fullName: true,
              birthDate: true,
              birthTime: false,
              birthPlace: false,
              gender: false,
            }}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hazır Paketler</CardTitle>
                  <CardDescription>Hızlı başlamak için hazır konu paketlerini kullanın</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicPackages.map((pkg) => (
                  <Card key={pkg.name} className="cursor-pointer hover:border-primary" onClick={() => selectPackage(pkg.topics)}>
                    <CardHeader>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.topics.length} konu - {pkg.credits} kredi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {pkg.credits <= 3 ? "20-30 saniye" : pkg.credits <= 5 ? "30-45 saniye" : "45-60 saniye"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analiz Konuları</CardTitle>
                  <CardDescription>Her konu 1 kredi - Mevcut: {availableCredits} kredi</CardDescription>
                </div>
                <Button variant="outline" onClick={toggleSelectAll}>
                  {selectAll ? "Tümünü Kaldır" : "Tümünü Seç"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTopics.length > 10 && (
                <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-500">
                    10'dan fazla konu seçtiniz. Analiz daha uzun sürebilir (90-120 saniye).
                  </AlertDescription>
                </Alert>
              )}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allTopics.map((topic) => (
                    <div key={topic.name} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                      <Checkbox
                        id={topic.name}
                        checked={selectedTopics.includes(topic.name)}
                        onCheckedChange={() => toggleTopic(topic.name)}
                        disabled={selectedTopics.length >= 13 && !selectedTopics.includes(topic.name)}
                      />
                      <Label htmlFor={topic.name} className="flex-1 cursor-pointer">{topic.name}</Label>
                      <Badge variant="secondary" className={topic.color}>
                        {topic.badge}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Coins className="w-4 h-4" />1
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {selectedTopics.length} konu seçildi
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Coins className="w-5 h-5" />
                  {selectedTopics.length} kredi
                </div>
              </div>
              {availableCredits < selectedTopics.length && (
                <p className="text-destructive text-sm mb-4">Yetersiz kredi!</p>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedTopics.length === 0 || selectedTopics.length > 13 || availableCredits < selectedTopics.length || !personData.fullName || !personData.birthDate}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analiz Ediliyor..." : "Analizi Başlat"}
              </Button>
              {selectedTopics.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Clock className="w-4 h-4" />
                  Tahmini süre: {selectedTopics.length <= 3 ? "20-30" : selectedTopics.length <= 5 ? "30-45" : selectedTopics.length <= 8 ? "45-60" : "60-120"} saniye
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
