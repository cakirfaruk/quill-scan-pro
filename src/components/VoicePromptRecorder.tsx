import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface VoicePromptRecorderProps {
  userId: string;
  existingPrompt?: {
    audio_url: string;
    duration_seconds: number;
    prompt_question?: string;
  } | null;
  onSaved?: () => void;
}

const MAX_DURATION = 30; // 30 seconds max

export const VoicePromptRecorder = ({
  userId,
  existingPrompt,
  onSaved,
}: VoicePromptRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingPrompt?.audio_url || null);
  const [duration, setDuration] = useState(existingPrompt?.duration_seconds || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Mikrofon Hatası",
        description: "Mikrofona erişilemedi. Lütfen izin verin.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const saveRecording = async () => {
    if (!audioBlob) return;

    setIsSaving(true);
    try {
      const fileName = `voice-prompt-${userId}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(`voice-prompts/${fileName}`, audioBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(`voice-prompts/${fileName}`);

      const { error: dbError } = await supabase.from("voice_prompts").upsert({
        user_id: userId,
        audio_url: urlData.publicUrl,
        duration_seconds: duration,
      });

      if (dbError) throw dbError;

      toast({
        title: "Kayıt Başarılı",
        description: "Sesli tanıtımınız kaydedildi.",
      });
      onSaved?.();
    } catch (error) {
      console.error("Error saving voice prompt:", error);
      toast({
        title: "Hata",
        description: "Kayıt sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Sesli Tanıtım
        </h3>
        <span className="text-sm text-muted-foreground">
          {formatTime(duration)} / {formatTime(MAX_DURATION)}
        </span>
      </div>

      <Progress value={(duration / MAX_DURATION) * 100} className="h-2" />

      {/* Recording/Playback Area */}
      <div className="flex items-center justify-center gap-4 py-4">
        {!audioUrl ? (
          <motion.div
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full w-16 h-16"
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={isPlaying ? pauseAudio : playAudio}
              className="rounded-full w-12 h-12"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={deleteRecording}
              className="text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Save Button */}
      {audioBlob && (
        <Button onClick={saveRecording} disabled={isSaving} className="w-full gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Kaydet
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {isRecording
          ? "Kayıt yapılıyor... Durdurmak için tıklayın."
          : audioUrl
          ? "Kaydınızı dinleyin veya yeniden kaydedin."
          : "30 saniyelik bir sesli tanıtım kaydedin."}
      </p>
    </Card>
  );
};
