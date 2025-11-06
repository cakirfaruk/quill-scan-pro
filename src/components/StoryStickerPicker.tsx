import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile } from "lucide-react";

interface StoryStickerPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sticker: string) => void;
}

const stickerCategories = {
  emojis: ["😀", "😂", "🥰", "😎", "🤔", "😱", "🎉", "❤️", "🔥", "✨", "👍", "👏", "🙌", "🤝", "💪", "🎈"],
  location: ["📍", "🗺️", "🏠", "🏙️", "🌍", "✈️", "🚗", "🚢", "🏖️", "⛰️", "🏔️", "🌄"],
  time: ["⏰", "⏱️", "⌚", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘"],
  weather: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "❄️", "⛄", "🌈"],
};

export const StoryStickerPicker = ({ open, onOpenChange, onSelect }: StoryStickerPickerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="w-5 h-5" />
            Sticker Seç
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="emojis" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emojis">Emoji</TabsTrigger>
            <TabsTrigger value="location">Konum</TabsTrigger>
            <TabsTrigger value="time">Zaman</TabsTrigger>
            <TabsTrigger value="weather">Hava</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[300px] mt-4">
            {Object.entries(stickerCategories).map(([category, stickers]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-4 gap-2">
                  {stickers.map((sticker, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-16 text-3xl hover:bg-primary/10"
                      onClick={() => {
                        onSelect(sticker);
                        onOpenChange(false);
                      }}
                    >
                      {sticker}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
