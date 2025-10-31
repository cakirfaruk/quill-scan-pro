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

// Tarot card deck
const MAJOR_ARCANA = [
  { name: "The Fool", suit: "Major Arcana", number: 0 },
  { name: "The Magician", suit: "Major Arcana", number: 1 },
  { name: "The High Priestess", suit: "Major Arcana", number: 2 },
  { name: "The Empress", suit: "Major Arcana", number: 3 },
  { name: "The Emperor", suit: "Major Arcana", number: 4 },
  { name: "The Hierophant", suit: "Major Arcana", number: 5 },
  { name: "The Lovers", suit: "Major Arcana", number: 6 },
  { name: "The Chariot", suit: "Major Arcana", number: 7 },
  { name: "Strength", suit: "Major Arcana", number: 8 },
  { name: "The Hermit", suit: "Major Arcana", number: 9 },
  { name: "Wheel of Fortune", suit: "Major Arcana", number: 10 },
  { name: "Justice", suit: "Major Arcana", number: 11 },
  { name: "The Hanged Man", suit: "Major Arcana", number: 12 },
  { name: "Death", suit: "Major Arcana", number: 13 },
  { name: "Temperance", suit: "Major Arcana", number: 14 },
  { name: "The Devil", suit: "Major Arcana", number: 15 },
  { name: "The Tower", suit: "Major Arcana", number: 16 },
  { name: "The Star", suit: "Major Arcana", number: 17 },
  { name: "The Moon", suit: "Major Arcana", number: 18 },
  { name: "The Sun", suit: "Major Arcana", number: 19 },
  { name: "Judgment", suit: "Major Arcana", number: 20 },
  { name: "The World", suit: "Major Arcana", number: 21 },
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

  const removeCard = (indexToRemove: number) => {
    setSelectedCards(selectedCards.filter((_, i) => i !== indexToRemove));
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
      const { data, error } = await supabase.functions.invoke('analyze-tarot', {
        body: { 
          spreadType,
          question: question || null,
          selectedCards
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
                          className={`aspect-[2/3] rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 opacity-50 cursor-not-allowed'
                              : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:scale-105 border-purple-400 hover:shadow-lg cursor-pointer'
                          }`}
                        >
                          <div className="h-full flex items-center justify-center text-white text-xs font-bold p-1">
                            {isSelected ? '✓' : '🔮'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCards.length > 0 && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-3">Seçilen Kartlar:</h3>
                    <div className="space-y-2">
                      {selectedCards.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                          <span className="font-medium">
                            {index + 1}. {card.name} {card.isReversed && '(Ters)'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCard(index)}
                          >
                            Kaldır
                          </Button>
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
                <CardTitle>Tarot Okuma Sonucu</CardTitle>
                <CardDescription>Kartlarınız yorumlandı</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.cards && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Kart Yorumları:</h3>
                    {result.cards.map((card: any, index: number) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold text-purple-600 mb-2">{card.position}</h4>
                        <p className="mb-2">{card.interpretation}</p>
                        <div className="flex flex-wrap gap-2">
                          {card.keywords?.map((keyword: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.overall && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Genel Yorum:</h3>
                    <p className="whitespace-pre-wrap">{result.overall}</p>
                  </div>
                )}

                {result.advice && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">💡 Tavsiyeler:</h3>
                    <p className="whitespace-pre-wrap">{result.advice}</p>
                  </div>
                )}

                {result.warnings && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">⚠️ Dikkat:</h3>
                    <p className="whitespace-pre-wrap">{result.warnings}</p>
                  </div>
                )}

                {result.raw && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{result.raw}</p>
                  </div>
                )}

                <Button onClick={() => { setResult(null); setSelectedCards([]); shuffleDeck(); }} className="w-full">
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