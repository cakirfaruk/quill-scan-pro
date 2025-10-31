import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

const allTopics = [
  "Marjlar (Sol, Sağ, Üst, Alt)",
  "Satır Yönü",
  "Satır Aralığı",
  "Kelime Aralığı",
  "Harf Aralığı",
  "Yazı Boyutu",
  "Yazı Eğimi",
  "Baskı",
  "Yazı Hızı",
  "Form Seviyesi",
  "Hareket",
  "Bağlantı Şekilleri",
  "Kişisel Zamirler",
];

interface TopicSelectorProps {
  onAnalyze: (selectedTopics: string[]) => void;
  isAnalyzing: boolean;
  availableCredits: number;
}

export const TopicSelector = ({ onAnalyze, isAnalyzing, availableCredits }: TopicSelectorProps) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const toggleAll = () => {
    if (selectedTopics.length === allTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics([...allTopics]);
    }
  };

  const creditsNeeded = selectedTopics.length;
  const hasEnoughCredits = creditsNeeded <= availableCredits;

  return (
    <Card className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Analiz Başlıklarını Seçin</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Her başlık 1 kredi tüketir
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-lg self-start sm:self-auto">
          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-sm sm:text-base font-semibold text-primary">{availableCredits} kredi</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-4">
        <Button
          variant="outline"
          onClick={toggleAll}
          size="sm"
        >
          {selectedTopics.length === allTopics.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedTopics.length} / {allTopics.length} başlık seçildi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
        {allTopics.map((topic) => (
          <div
            key={topic}
            className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Checkbox
              id={topic}
              checked={selectedTopics.includes(topic)}
              onCheckedChange={() => toggleTopic(topic)}
              className="flex-shrink-0"
            />
            <Label
              htmlFor={topic}
              className="flex-1 cursor-pointer text-xs sm:text-sm font-medium leading-tight"
            >
              {topic}
            </Label>
            <span className="text-xs text-muted-foreground flex-shrink-0">1 kredi</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Toplam Maliyet:</span>
          <span className="font-bold text-primary">{creditsNeeded} kredi</span>
        </div>

        {!hasEnoughCredits && selectedTopics.length > 0 && (
          <p className="text-sm text-destructive">
            Yetersiz kredi! {creditsNeeded - availableCredits} kredi daha gerekli.
          </p>
        )}

        <Button
          onClick={() => onAnalyze(selectedTopics)}
          disabled={isAnalyzing || selectedTopics.length === 0 || !hasEnoughCredits}
          className="w-full bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          {isAnalyzing
            ? "Analiz ediliyor..."
            : `Analizi Başlat (${creditsNeeded} kredi)`}
        </Button>
      </div>
    </Card>
  );
};