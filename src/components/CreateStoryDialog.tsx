import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Camera, Music, Smile, Type, BarChart3, HelpCircle, Sparkles } from "lucide-react";
import { soundEffects } from "@/utils/soundEffects";
import { StoryMusicPicker } from "./StoryMusicPicker";
import { GifPicker } from "./GifPicker";
import { StoryStickerPicker } from "./StoryStickerPicker";
import { StoryTextEditor } from "./StoryTextEditor";
import { StoryPollCreator } from "./StoryPollCreator";
import { StoryQuestionCreator } from "./StoryQuestionCreator";
import { StoryCanvas } from "./StoryCanvas";
import { StoryFilterPicker } from "./StoryFilterPicker";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateStoryDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateStoryDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Story enhancement states
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showQuestionCreator, setShowQuestionCreator] = useState(false);

  const [selectedMusic, setSelectedMusic] = useState<{ name: string; artist: string; url: string } | null>(null);
  const [selectedGifs, setSelectedGifs] = useState<Array<{ url: string; x: number; y: number }>>([]);
  const [selectedStickers, setSelectedStickers] = useState<Array<{ emoji: string; x: number; y: number; size: number }>>([]);
  const [textElements, setTextElements] = useState<Array<{ text: string; font: string; color: string; size: number; animation: string; x: number; y: number }>>([]);
  const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<{ name: string; value: string }>({ name: "Normal", value: "none" });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Maksimum dosya boyutu 50MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    const type = selectedFile.type.startsWith("image/") ? "photo" : "video";
    setMediaType(type);
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !mediaType) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        const storyData: any = {
          user_id: user.id,
          media_url: base64Data,
          media_type: mediaType,
          background_color: backgroundColor,
        };

        // Add music if selected
        if (selectedMusic) {
          storyData.music_url = selectedMusic.url;
          storyData.music_name = selectedMusic.name;
          storyData.music_artist = selectedMusic.artist;
        }

        // Add stickers, gifs, and text effects
        if (selectedStickers.length > 0) {
          storyData.stickers = selectedStickers;
        }
        if (selectedGifs.length > 0) {
          storyData.gifs = selectedGifs;
        }
        if (textElements.length > 0) {
          storyData.text_effects = textElements;
        }

        // Add poll or question flags
        if (poll) {
          storyData.has_poll = true;
        }
        if (question) {
          storyData.has_question = true;
        }

        const { data: storyRecord, error } = await supabase
          .from("stories")
          .insert(storyData)
          .select()
          .single();

        if (error) throw error;

        // If there's a poll, create it
        if (poll && storyRecord) {
          await supabase.from("story_polls" as any).insert({
            story_id: storyRecord.id,
            question: poll.question,
            options: poll.options.map((opt, idx) => ({ id: idx, text: opt, votes: 0 })),
          } as any);
        }

        // If there's a question, create it
        if (question && storyRecord) {
          await supabase.from("story_questions" as any).insert({
            story_id: storyRecord.id,
            question: question,
          } as any);
        }

        soundEffects.playMatch();
        toast({
          title: "Başarılı!",
          description: "Hikayeniz paylaşıldı",
        });

        onSuccess();
        handleClose();
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      soundEffects.playError();
      toast({
        title: "Hata",
        description: error.message || "Hikaye yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setMediaType(null);
    setSelectedMusic(null);
    setSelectedGifs([]);
    setSelectedStickers([]);
    setTextElements([]);
    setPoll(null);
    setQuestion(null);
    setBackgroundColor("#000000");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Hikaye Oluştur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <div className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Fotoğraf veya video yükle
                </p>
                <p className="text-xs text-muted-foreground">
                  Maks. 50MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div style={{ filter: selectedFilter.value }}>
                <StoryCanvas
                  backgroundImage={preview}
                  mediaType={mediaType}
                  stickers={selectedStickers}
                  gifs={selectedGifs}
                  textElements={textElements}
                  onElementsUpdate={(data) => {
                    setSelectedStickers(data.stickers);
                    setSelectedGifs(data.gifs);
                    setTextElements(data.textElements);
                  }}
                />
              </div>

              {/* Clear/Reset button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setMediaType(null);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Değiştir
                </Button>
              </div>

              {/* Enhancement tools */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterPicker(true)}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Filtre
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMusicPicker(true)}
                >
                  <Music className="w-4 h-4 mr-1" />
                  Müzik
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGifPicker(true)}
                >
                  <Smile className="w-4 h-4 mr-1" />
                  GIF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStickerPicker(true)}
                >
                  <Smile className="w-4 h-4 mr-1" />
                  Sticker
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTextEditor(true)}
                >
                  <Type className="w-4 h-4 mr-1" />
                  Metin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPollCreator(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Anket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestionCreator(true)}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Soru
                </Button>
              </div>

              {/* Active enhancements display */}
              <div className="flex gap-2 flex-wrap text-xs">
                {selectedFilter.name !== "Normal" && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    ✨ {selectedFilter.name}
                  </span>
                )}
                {selectedMusic && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    🎵 {selectedMusic.name}
                  </span>
                )}
                {selectedStickers.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {selectedStickers.length} sticker
                  </span>
                )}
                {selectedGifs.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {selectedGifs.length} GIF
                  </span>
                )}
                {textElements.length > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {textElements.length} metin
                  </span>
                )}
                {poll && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    📊 Anket
                  </span>
                )}
                {question && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                    ❓ Soru
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  İptal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    "Paylaş"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Enhancement dialogs */}
        <StoryFilterPicker
          open={showFilterPicker}
          onOpenChange={setShowFilterPicker}
          onSelect={(filter) => {
            setSelectedFilter(filter);
            setShowFilterPicker(false);
          }}
        />

        <StoryMusicPicker
          open={showMusicPicker}
          onOpenChange={setShowMusicPicker}
          onSelect={(music) => {
            setSelectedMusic(music);
            setShowMusicPicker(false);
          }}
        />

        <GifPicker
          open={showGifPicker}
          onOpenChange={setShowGifPicker}
          onSelectGif={(url) => {
            setSelectedGifs([...selectedGifs, { url, x: 50, y: 50 }]);
            setShowGifPicker(false);
          }}
        />

        <StoryStickerPicker
          open={showStickerPicker}
          onOpenChange={setShowStickerPicker}
          onSelect={(sticker) => {
            setSelectedStickers([...selectedStickers, { emoji: sticker, x: 50, y: 50, size: 48 }]);
            setShowStickerPicker(false);
          }}
        />

        <StoryTextEditor
          open={showTextEditor}
          onOpenChange={setShowTextEditor}
          onSave={(textData) => {
            setTextElements([...textElements, { ...textData, x: 50, y: 50 }]);
            setShowTextEditor(false);
          }}
        />

        <StoryPollCreator
          open={showPollCreator}
          onOpenChange={setShowPollCreator}
          onSave={(pollData) => {
            setPoll(pollData);
            setShowPollCreator(false);
          }}
        />

        <StoryQuestionCreator
          open={showQuestionCreator}
          onOpenChange={setShowQuestionCreator}
          onSave={(questionData) => {
            setQuestion(questionData);
            setShowQuestionCreator(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
