import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MatchFiltersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MatchFilters;
  onApply: (filters: MatchFilters) => void;
}

export interface MatchFilters {
  ageRange: [number, number];
  gender: "male" | "female" | "all";
  zodiacSign: string[];
  element: string[];
  location: string;
}

const zodiacSigns = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"
];

const elements = ["Ateş", "Su", "Toprak", "Hava"];

export const MatchFiltersDialog = ({ isOpen, onClose, filters, onApply }: MatchFiltersDialogProps) => {
  const [localFilters, setLocalFilters] = useState<MatchFilters>(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: MatchFilters = {
      ageRange: [18, 99],
      gender: "all",
      zodiacSign: [],
      element: [],
      location: "",
    };
    setLocalFilters(defaultFilters);
  };

  const toggleZodiacSign = (sign: string) => {
    setLocalFilters(prev => ({
      ...prev,
      zodiacSign: prev.zodiacSign.includes(sign)
        ? prev.zodiacSign.filter(s => s !== sign)
        : [...prev.zodiacSign, sign]
    }));
  };

  const toggleElement = (element: string) => {
    setLocalFilters(prev => ({
      ...prev,
      element: prev.element.includes(element)
        ? prev.element.filter(e => e !== element)
        : [...prev.element, element]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gelişmiş Filtreler</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Age Range */}
          <div className="space-y-3">
            <Label>Yaş Aralığı: {localFilters.ageRange[0]} - {localFilters.ageRange[1]}</Label>
            <Slider
              min={18}
              max={99}
              step={1}
              value={localFilters.ageRange}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label>Cinsiyet</Label>
            <Select
              value={localFilters.gender}
              onValueChange={(value: "male" | "female" | "all") => 
                setLocalFilters(prev => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zodiac Signs */}
          <div className="space-y-3">
            <Label>Burç Seçimi</Label>
            <div className="flex flex-wrap gap-2">
              {zodiacSigns.map((sign) => (
                <Badge
                  key={sign}
                  variant={localFilters.zodiacSign.includes(sign) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleZodiacSign(sign)}
                >
                  {sign}
                  {localFilters.zodiacSign.includes(sign) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Elements */}
          <div className="space-y-3">
            <Label>Element Seçimi</Label>
            <div className="flex flex-wrap gap-2">
              {elements.map((element) => (
                <Badge
                  key={element}
                  variant={localFilters.element.includes(element) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleElement(element)}
                >
                  {element}
                  {localFilters.element.includes(element) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label>Şehir</Label>
            <Input
              value={localFilters.location}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Örn: İstanbul"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Sıfırla
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Uygula
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
