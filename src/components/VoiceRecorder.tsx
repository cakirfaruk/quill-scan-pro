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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'transparent';
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'hsl(var(--destructive))';
      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for waveform visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

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
        
        // Stop waveform animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start waveform visualization
      drawWaveform();

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
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-destructive">{formatTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground ml-auto">Max: 5:00</span>
            </div>
            <canvas 
              ref={canvasRef}
              width={300}
              height={60}
              className="w-full h-[60px] rounded-md bg-muted/30"
            />
          </div>
          <Button
            size="icon"
            variant="secondary"
            onClick={stopRecording}
            className="h-10 w-10"
          >
            <Square className="h-4 w-4" />
          </Button>
        </>
      )}

      {!isRecording && audioBlob && audioUrl && (
        <>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ses kaydı</span>
              <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
            </div>
            <audio controls className="w-full h-8" src={audioUrl} />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={deleteRecording}
            className="h-10 w-10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            className="rounded-full h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
