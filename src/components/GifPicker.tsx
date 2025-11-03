import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
}

export const GifPicker = ({ onSelectGif }: GifPickerProps) => {
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
    <div className="w-[400px] h-[400px] flex flex-col">
      <div className="p-3 border-b">
        <Input
          placeholder="GIF ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="flex-1 p-2">
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelectGif(gif.media_formats.gif.url)}
                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={gif.media_formats.tinygif.url}
                  alt={gif.content_description}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
