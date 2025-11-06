import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Search } from "lucide-react";

interface StoryMusicPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (music: { name: string; artist: string; url: string }) => void;
}

// Mock music data - In production, integrate with Spotify or Apple Music API
const popularMusic = [
  { id: 1, name: "Summer Vibes", artist: "DJ Sunshine", url: "/music/sample1.mp3" },
  { id: 2, name: "Midnight Dreams", artist: "Luna Moon", url: "/music/sample2.mp3" },
  { id: 3, name: "Happy Days", artist: "Cheerful Beats", url: "/music/sample3.mp3" },
  { id: 4, name: "Chill Mode", artist: "Relax Studio", url: "/music/sample4.mp3" },
  { id: 5, name: "Party Time", artist: "Dance Nation", url: "/music/sample5.mp3" },
];

export const StoryMusicPicker = ({ open, onOpenChange, onSelect }: StoryMusicPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMusic, setFilteredMusic] = useState(popularMusic);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = popularMusic.filter(
      (music) =>
        music.name.toLowerCase().includes(query.toLowerCase()) ||
        music.artist.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMusic(filtered);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Müzik Seç
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Müzik ara..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredMusic.map((music) => (
                <Button
                  key={music.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => onSelect(music)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{music.name}</p>
                      <p className="text-sm text-muted-foreground">{music.artist}</p>
                    </div>
                  </div>
                </Button>
              ))}

              {filteredMusic.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Müzik bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
