import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

interface StoryFilterPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filter: { name: string; value: string }) => void;
}

const filters = [
  { name: "Normal", value: "none", style: {} },
  { name: "Siyah-Beyaz", value: "grayscale(100%)", style: { filter: "grayscale(100%)" } },
  { name: "Sepia", value: "sepia(80%)", style: { filter: "sepia(80%)" } },
  { name: "Vintage", value: "sepia(50%) contrast(1.2) brightness(1.1)", style: { filter: "sepia(50%) contrast(1.2) brightness(1.1)" } },
  { name: "Soğuk", value: "brightness(1.1) saturate(1.3) hue-rotate(180deg)", style: { filter: "brightness(1.1) saturate(1.3) hue-rotate(180deg)" } },
  { name: "Sıcak", value: "brightness(1.1) saturate(1.5) hue-rotate(-20deg)", style: { filter: "brightness(1.1) saturate(1.5) hue-rotate(-20deg)" } },
  { name: "Yüksek Kontrast", value: "contrast(1.5)", style: { filter: "contrast(1.5)" } },
  { name: "Parlak", value: "brightness(1.3) saturate(1.2)", style: { filter: "brightness(1.3) saturate(1.2)" } },
  { name: "Soluk", value: "brightness(1.2) saturate(0.7)", style: { filter: "brightness(1.2) saturate(0.7)" } },
  { name: "Dramatik", value: "contrast(1.4) brightness(0.9) saturate(1.3)", style: { filter: "contrast(1.4) brightness(0.9) saturate(1.3)" } },
];

export const StoryFilterPicker = ({ open, onOpenChange, onSelect }: StoryFilterPickerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Filtre Seç
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-3 gap-2 p-2">
            {filters.map((filter) => (
              <button
                key={filter.name}
                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                onClick={() => {
                  onSelect(filter);
                  onOpenChange(false);
                }}
              >
                <div
                  className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-300 to-orange-300"
                  style={filter.style}
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm p-1 text-white text-xs text-center">
                  {filter.name}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
