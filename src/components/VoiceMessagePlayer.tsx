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
  messageId: string;
}

export const VoiceMessagePlayer = ({ audioUrl, duration, preferredLanguage = 'tr', autoTranscribe = false, messageId }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Check cache on mount
  useEffect(() => {
    const checkCache = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('transcription, translation, transcription_language')
          .eq('id', messageId)
          .maybeSingle();

        if (!error && data?.transcription) {
          setTranscription(data.transcription);
          setTranslation(data.translation);
          setSourceLanguage(data.transcription_language);
          
          // Auto-show transcript if we have cached data and auto-transcribe is on
          if (autoTranscribe) {
            setShowTranscript(true);
          }
        }
      } catch (error) {
        console.error('Error checking cache:', error);
      }
    };

    checkCache();
  }, [messageId, autoTranscribe]);

  // Auto-transcribe on mount if enabled and no cache
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
    setError(null); // Clear previous errors
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
        const newTranscription = data.transcription;
        const newTranslation = data.translation;
        const newSourceLanguage = data.sourceLanguage;
        
        setTranscription(newTranscription);
        setShowTranscript(true);
        setSourceLanguage(newSourceLanguage);
        
        if (newTranslation) {
          setTranslation(newTranslation);
        }

        // Cache the results in the database
        try {
          await supabase
            .from('messages')
            .update({
              transcription: newTranscription,
              translation: newTranslation,
              transcription_language: newSourceLanguage
            })
            .eq('id', messageId);
        } catch (cacheError) {
          console.error('Error caching transcription:', cacheError);
          // Don't show error to user, just log it
        }
        
        if (newTranslation) {
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
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError(errorMessage);
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
      <div className="relative flex items-center gap-2 bg-accent/30 rounded-lg p-2 min-w-[200px]">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {isTranscribing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="absolute inset-0 h-6 w-6 rounded-full border-2 border-primary/20 animate-pulse" />
              </div>
              <p className="text-xs font-medium text-primary">İşleniyor...</p>
            </div>
          </div>
        )}
        
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
          <div className="h-1 bg-muted rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
            {isTranscribing && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[slide-in-right_1.5s_ease-in-out_infinite]" />
              </div>
            )}
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

      {/* Error display with retry */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-2 text-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 animate-[scale-in_0.3s_ease-out]">
              <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-medium text-destructive">Transkript Hatası</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTranscribe(true)}
                className="h-7 text-xs border-destructive/30 hover:bg-destructive/10"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Yeniden Dene
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Transcript display */}
      {showTranscript && transcription && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 opacity-70" />
              <span className="text-xs font-medium opacity-70">
                Transkript {sourceLanguage && `(${sourceLanguage})`}
              </span>
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
