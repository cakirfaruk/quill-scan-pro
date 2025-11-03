import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface MatchFiltersType {
  ageRange: [number, number];
  requireNumerology: boolean;
  requireBirthChart: boolean;
  minCompatibility?: number;
}

interface MatchFiltersProps {
  filters: MatchFiltersType;
  onFiltersChange: (filters: MatchFiltersType) => void;
  onApply: () => void;
}

export const MatchFilters = ({ filters, onFiltersChange, onApply }: MatchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.requireNumerology,
    filters.requireBirthChart,
    filters.minCompatibility !== undefined,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({
      ageRange: [18, 99],
      requireNumerology: false,
      requireBirthChart: false,
    });
  };

  const handleApply = () => {
    onApply();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filtreler
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Eşleşme Filtreleri</SheetTitle>
          <SheetDescription>
            Aradığınız kriterlere göre profilleri filtreleyin
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Age Range */}
          <div className="space-y-3">
            <Label>Yaş Aralığı</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">{filters.ageRange[0]}</span>
              <Slider
                value={filters.ageRange}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, ageRange: value as [number, number] })
                }
                min={18}
                max={99}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8">{filters.ageRange[1]}</span>
            </div>
          </div>

          {/* Numerology Requirement */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base">Numeroloji Analizi</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Sadece numeroloji analizi olan profiller
                </p>
              </div>
              <Switch
                checked={filters.requireNumerology}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, requireNumerology: checked })
                }
              />
            </div>
          </Card>

          {/* Birth Chart Requirement */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-base">Doğum Haritası</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Sadece doğum haritası olan profiller
                </p>
              </div>
              <Switch
                checked={filters.requireBirthChart}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, requireBirthChart: checked })
                }
              />
            </div>
          </Card>

          {/* Min Compatibility */}
          {filters.minCompatibility !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Minimum Uyum</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newFilters = { ...filters };
                    delete newFilters.minCompatibility;
                    onFiltersChange(newFilters);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[filters.minCompatibility]}
                  onValueChange={([value]) =>
                    onFiltersChange({ ...filters, minCompatibility: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">%{filters.minCompatibility}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Sıfırla
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Uygula
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};