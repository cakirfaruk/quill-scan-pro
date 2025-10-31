import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const allTopics = [
  "Kader Rakamı (Yaşam Yolu Sayısı)",
  "İsim Analizi ve Dokuzlu Vefk",
  "Doğum Tarihi Numerolojisi",
  "Yaşam Döngüleri (0-28, 29-56, 56+)",
  "Zirve Döngüsü Rakamları",
  "Ruhun Arzusu Rakamı",
  "Kişisel Rakam (Dış Dünya İlişkisi)",
  "Kemal (Olgunluk) Rakamı",
  "Karmik Borç Rakamı",
  "Dominant Rakamlar",
  "Şanslı ve Şanssız Rakamlar",
  "Kişisel Döngüler ve Evrensel Döngüler",
  "1-9 Arası Rakamların Ezoterik Anlamları",
];

export default function Numerology() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
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

    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

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
      setSelectedTopics([...allTopics]);
    }
    setSelectAll(!selectAll);
  };

  const handleAnalyze = async () => {
    if (!fullName.trim() || !birthDate) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen ad soyad ve doğum tarihinizi girin.",
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
    try {
      const { data, error } = await supabase.functions.invoke("analyze-numerology", {
        body: { fullName, birthDate, selectedTopics },
      });

      if (error) throw error;

      setAnalysisResult(data.result);
      setAvailableCredits((prev) => prev - requiredCredits);
      
      toast({
        title: "Analiz Tamamlandı",
        description: `${requiredCredits} kredi kullanıldı.`,
      });
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
    setAnalysisResult(null);
    setFullName("");
    setBirthDate("");
    setSelectedTopics([]);
    setSelectAll(false);
  };

  const renderAnalysisSection = (key: string, data: any) => {
    if (typeof data === 'string') {
      return <p className="text-muted-foreground whitespace-pre-wrap">{data}</p>;
    }
    
    if (typeof data === 'number') {
      return <p className="text-muted-foreground">{data}</p>;
    }
    
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc pl-5 text-muted-foreground">
          {data.map((item, idx) => (
            <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
          ))}
        </ul>
      );
    }
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-3 ml-4">
          {Object.entries(data).map(([subKey, subValue]: [string, any]) => (
            <div key={subKey}>
              <h4 className="text-sm font-semibold text-primary capitalize mb-1">
                {subKey.replace(/_/g, ' ')}:
              </h4>
              {renderAnalysisSection(subKey, subValue)}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
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
                {analysisData.isim || fullName} - {analysisData.dogum_tarihi ? new Date(analysisData.dogum_tarihi).toLocaleDateString("tr-TR") : new Date(birthDate).toLocaleDateString("tr-TR")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(analysisData).map(([topic, content]: [string, any]) => {
                if (topic === 'isim' || topic === 'dogum_tarihi') return null;
                
                return (
                  <div key={topic} className="border-b pb-6 last:border-b-0">
                    <h3 className="text-xl font-semibold mb-4 capitalize">
                      {topic.replace(/_/g, ' ')}
                    </h3>
                    {renderAnalysisSection(topic, content)}
                  </div>
                );
              })}
              <Button onClick={handleReset} className="w-full">Yeni Analiz Yap</Button>
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

          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>Ad soyad ve doğum tarihinizi girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Doğum Tarihi</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
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
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {allTopics.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                      <Checkbox
                        id={topic}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => toggleTopic(topic)}
                      />
                      <Label htmlFor={topic} className="flex-1 cursor-pointer">{topic}</Label>
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
                disabled={isAnalyzing || selectedTopics.length === 0 || availableCredits < selectedTopics.length}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analiz Ediliyor..." : "Analizi Başlat"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
