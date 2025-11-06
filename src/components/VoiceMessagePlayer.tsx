import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, FileText, Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  preferredLanguage?: string;
  autoTranscribe?: boolean;
}

export const VoiceMessagePlayer = ({ audioUrl, duration, preferredLanguage = 'tr', autoTranscribe = false }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Auto-transcribe on mount if enabled
  useEffect(() => {
    if (autoTranscribe && !transcription && !isTranscribing) {
      handleTranscribe(true); // Auto-translate as well
    }
  }, [autoTranscribe]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTranscribe = async (translateAlso: boolean = false) => {
    setIsTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audioUrl, 
          translate: translateAlso,
          targetLanguage: preferredLanguage
        }
      });

      if (error) throw error;

      if (data?.transcription) {
        setTranscription(data.transcription);
        setShowTranscript(true);
        
        if (data.translation) {
          setTranslation(data.translation);
          toast({
            title: "Başarılı",
            description: "Sesli mesaj metne dönüştürüldü ve çevrildi",
          });
        } else {
          toast({
            title: "Başarılı",
            description: "Sesli mesaj metne dönüştürüldü",
          });
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Hata",
        description: "Sesli mesaj metne dönüştürülürken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="space-y-2">{/* Wrapper for player and transcript */}
      <div className="flex items-center gap-2 bg-accent/30 rounded-lg p-2 min-w-[200px]">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlay}
          className="h-8 w-8 rounded-full flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 space-y-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </div>
        </div>

        {/* Transcription actions */}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleTranscribe(false)}
            disabled={isTranscribing}
            className="h-8 w-8"
            title="Metne Dönüştür"
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleTranscribe(true)}
            disabled={isTranscribing}
            className="h-8 w-8"
            title="Metne Dönüştür ve Çevir"
          >
            <Languages className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transcript display */}
      {showTranscript && transcription && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 opacity-70" />
              <span className="text-xs font-medium opacity-70">Transkript</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(false)}
              className="h-6 px-2 text-xs"
            >
              ✕
            </Button>
          </div>
          <p className="whitespace-pre-wrap">{transcription}</p>
          
          {translation && (
            <div className="pt-2 border-t border-border/50 space-y-1">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3 h-3 opacity-70" />
                <span className="text-xs font-medium opacity-70">Çeviri</span>
              </div>
              <p className="whitespace-pre-wrap font-medium">{translation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
