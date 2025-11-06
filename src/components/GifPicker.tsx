import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Smile } from "lucide-react";

interface GifPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGif: (gifUrl: string) => void;
}

export const GifPicker = ({ open, onOpenChange, onSelectGif }: GifPickerProps) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrendingGifs();
  }, []);

  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => {
        searchGifs(search);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      loadTrendingGifs();
    }
  }, [search]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      // Using Tenor API (free, no key required for basic usage)
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=20&media_filter=gif`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error("Error loading trending GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=20&media_filter=gif`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error("Error searching GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="w-5 h-5" />
            GIF Seç
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="p-3 border-b">
            <Input
              placeholder="GIF ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] p-2">
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => {
                      onSelectGif(gif.media_formats.gif.url);
                      onOpenChange(false);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={gif.media_formats.gif.url}
                      alt={gif.content_description || gif.title || 'GIF'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {gifs.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>GIF bulunamadı</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
