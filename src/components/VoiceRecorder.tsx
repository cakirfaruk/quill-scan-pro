import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const VoiceRecorder = ({ onSend, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 300) { // Max 5 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Microphone access error:", error);
      toast({
        title: "Hata",
        description: "Mikrofona erişim izni verilmedi.",
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

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
      {!isRecording && !audioBlob && (
        <>
          <Button
            size="icon"
            variant="destructive"
            onClick={startRecording}
            className="rounded-full"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Kayda başlamak için tıkla</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}

      {isRecording && (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-destructive transition-all"
                style={{ width: `${(recordingTime / 300) * 100}%` }}
              />
            </div>
          </div>
          <Button
            size="icon"
            variant="secondary"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4" />
          </Button>
        </>
      )}

      {!isRecording && audioBlob && audioUrl && (
        <>
          <audio controls className="flex-1" src={audioUrl} />
          <Button
            size="icon"
            variant="ghost"
            onClick={deleteRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            className="rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
