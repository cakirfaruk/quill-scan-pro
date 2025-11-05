import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Shuffle } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { ShareButton } from "@/components/ShareButton";
import { useOGImage } from "@/hooks/use-og-image";

// Import tarot card images
import cardBackImg from "@/assets/tarot/card-back.png";
import deliImg from "@/assets/tarot/deli.png";
import buyucuImg from "@/assets/tarot/buyucu.png";
import basRahibeAzizeImg from "@/assets/tarot/bas-rahibe-azize.png";
import imparatoriceImg from "@/assets/tarot/imparatorice.png";
import imparatorImg from "@/assets/tarot/imparator.png";
import basRahipAzizImg from "@/assets/tarot/bas-rahip-aziz.png";
import asiklarImg from "@/assets/tarot/asiklar.png";
import savasArabasiImg from "@/assets/tarot/savas-arabasi.png";
import gucImg from "@/assets/tarot/guc.png";
import ermisImg from "@/assets/tarot/ermis.png";
import kaderCarkiImg from "@/assets/tarot/kader-carki.png";
import adaletImg from "@/assets/tarot/adalet.png";
import asilanAdamImg from "@/assets/tarot/asilan-adam.png";
import olumImg from "@/assets/tarot/olum.png";
import dengeImg from "@/assets/tarot/denge.png";
import seytanImg from "@/assets/tarot/seytan.png";
import yikilanKuleImg from "@/assets/tarot/yikilan-kule.png";
import yildizImg from "@/assets/tarot/yildiz.png";
import ayImg from "@/assets/tarot/ay.png";
import gunesImg from "@/assets/tarot/gunes.png";
import mahkemeImg from "@/assets/tarot/mahkeme.png";
import dunyaImg from "@/assets/tarot/dunya.png";

// Tarot card deck
const MAJOR_ARCANA = [
  { name: "Deli", englishName: "The Fool", suit: "Major Arcana", number: 0, image: deliImg },
  { name: "Büyücü", englishName: "The Magician", suit: "Major Arcana", number: 1, image: buyucuImg },
  { name: "Baş Rahibe", englishName: "The High Priestess", suit: "Major Arcana", number: 2, image: basRahibeAzizeImg },
  { name: "İmparatoriçe", englishName: "The Empress", suit: "Major Arcana", number: 3, image: imparatoriceImg },
  { name: "İmparator", englishName: "The Emperor", suit: "Major Arcana", number: 4, image: imparatorImg },
  { name: "Baş Rahip", englishName: "The Hierophant", suit: "Major Arcana", number: 5, image: basRahipAzizImg },
  { name: "Aşıklar", englishName: "The Lovers", suit: "Major Arcana", number: 6, image: asiklarImg },
  { name: "Savaş Arabası", englishName: "The Chariot", suit: "Major Arcana", number: 7, image: savasArabasiImg },
  { name: "Güç", englishName: "Strength", suit: "Major Arcana", number: 8, image: gucImg },
  { name: "Ermiş", englishName: "The Hermit", suit: "Major Arcana", number: 9, image: ermisImg },
  { name: "Kader Çarkı", englishName: "Wheel of Fortune", suit: "Major Arcana", number: 10, image: kaderCarkiImg },
  { name: "Adalet", englishName: "Justice", suit: "Major Arcana", number: 11, image: adaletImg },
  { name: "Asılan Adam", englishName: "The Hanged Man", suit: "Major Arcana", number: 12, image: asilanAdamImg },
  { name: "Ölüm", englishName: "Death", suit: "Major Arcana", number: 13, image: olumImg },
  { name: "Denge", englishName: "Temperance", suit: "Major Arcana", number: 14, image: dengeImg },
  { name: "Şeytan", englishName: "The Devil", suit: "Major Arcana", number: 15, image: seytanImg },
  { name: "Yıkılan Kule", englishName: "The Tower", suit: "Major Arcana", number: 16, image: yikilanKuleImg },
  { name: "Yıldız", englishName: "The Star", suit: "Major Arcana", number: 17, image: yildizImg },
  { name: "Ay", englishName: "The Moon", suit: "Major Arcana", number: 18, image: ayImg },
  { name: "Güneş", englishName: "The Sun", suit: "Major Arcana", number: 19, image: gunesImg },
  { name: "Mahkeme", englishName: "Judgment", suit: "Major Arcana", number: 20, image: mahkemeImg },
  { name: "Dünya", englishName: "The World", suit: "Major Arcana", number: 21, image: dunyaImg },
];

const SPREAD_TYPES = [
  { value: "past-present-future", label: "Geçmiş-Şimdi-Gelecek (3 Kart)", cards: 3 },
  { value: "love", label: "Aşk Okuma (5 Kart)", cards: 5 },
  { value: "career", label: "Kariyer Okuma (5 Kart)", cards: 5 },
  { value: "celtic-cross", label: "Celtic Cross (10 Kart)", cards: 10 },
];

const Tarot = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [spreadType, setSpreadType] = useState("past-present-future");
  const [question, setQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [shuffledDeck, setShuffledDeck] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);

  const selectedSpread = SPREAD_TYPES.find(s => s.value === spreadType);
  
  // Generate OG image when result is available
  useOGImage({
    title: result ? `Tarot Falı - ${question || 'Kişisel Analiz'}` : '',
    description: result?.interpretation?.overview || '',
    type: 'tarot'
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

  const shuffleDeck = () => {
    const deck = [...MAJOR_ARCANA];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setShuffledDeck(deck);
    setSelectedCards([]);
  };

  const selectCard = (card: any, index: number) => {
    if (selectedCards.length >= (selectedSpread?.cards || 3)) {
      toast.error("Maksimum kart sayısına ulaştınız");
      return;
    }
    
    const isReversed = Math.random() > 0.5;
    setSelectedCards([...selectedCards, { ...card, isReversed, deckIndex: index }]);
  };


  const handleAnalyze = async () => {
    if (selectedCards.length !== selectedSpread?.cards) {
      toast.error(`Lütfen ${selectedSpread?.cards} kart seçin`);
      return;
    }

    if (userCredits < 30) {
      toast.error("Yetersiz kredi. Lütfen kredi satın alın.");
      navigate("/credits");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('analyze-tarot', {
        body: { 
          spreadType,
          question: question || null,
          selectedCards
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      setResult(data.interpretation);
      setUserCredits(prev => prev - 30);
      toast.success("Tarot okuma tamamlandı!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Analiz sırasında hata oluştu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-background to-background dark:from-purple-950/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔮 Tarot Okuma
          </h1>
          <p className="text-muted-foreground">
            Kartları seç, sorunuzu sorun ve geleceğinizi keşfedin
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Mevcut Kredi:</span>
            <span className="font-bold text-lg">{userCredits}</span>
            <span className="text-sm text-muted-foreground">| Maliyet: 30 kredi</span>
          </div>
        </div>

        {!result ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Okuma Türünü Seçin</CardTitle>
                <CardDescription>Hangi konuda rehberlik almak istiyorsunuz?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={spreadType} onValueChange={(value) => { setSpreadType(value); setSelectedCards([]); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPREAD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Sorunuzu buraya yazın (opsiyonel)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Kartları Karıştırın ve Seçin</CardTitle>
                <CardDescription>
                  {selectedCards.length} / {selectedSpread?.cards} kart seçildi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {shuffledDeck.length === 0 ? (
                  <Button onClick={shuffleDeck} className="w-full" size="lg">
                    <Shuffle className="w-5 h-5 mr-2" />
                    Kartları Karıştır
                  </Button>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {shuffledDeck.map((card, index) => {
                      const isSelected = selectedCards.some(c => c.deckIndex === index);
                      return (
                        <button
                          key={index}
                          onClick={() => !isSelected && selectCard(card, index)}
                          disabled={isSelected}
                          className={`aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-purple-400 cursor-not-allowed'
                              : 'border-purple-400 hover:scale-105 hover:shadow-lg cursor-pointer'
                          }`}
                        >
                          <img 
                            src={isSelected ? card.image : cardBackImg} 
                            alt={isSelected ? card.name : "Tarot kartı"}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCards.length > 0 && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-3">Seçilen Kartlar:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {selectedCards.map((card, index) => (
                        <div key={index} className="text-center">
                          <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-purple-400 mb-2">
                            {card.image ? (
                              <img 
                                src={card.image} 
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold">
                                🔮
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {index + 1}. {card.name}
                          </p>
                          {card.isReversed && (
                            <p className="text-xs text-muted-foreground">(Ters)</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={selectedCards.length !== selectedSpread?.cards || isAnalyzing}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Okuma Yap (30 Kredi)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>🔮 Tarot Okuma Sonucu</CardTitle>
                    <CardDescription>Kartlarınız yorumlandı</CardDescription>
                  </div>
                  <ShareButton
                    title="Tarot Falım - Astro Social"
                    text={`${selectedSpread?.label} yöntemiyle tarot falına baktım!\n\nSeçilen kartlar: ${selectedCards.map(c => c.name).join(', ')}\n\nSonuçlarımı Astro Social'da keşfedin!`}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <AnalysisDetailView result={result} analysisType="tarot" />
                
                <Button onClick={() => { setResult(null); setSelectedCards([]); shuffleDeck(); }} className="w-full mt-6">
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

export default Tarot;