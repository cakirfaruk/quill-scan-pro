import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Video, Square, Play, Trash2, Upload, Loader2, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface VideoPromptRecorderProps {
  userId: string;
  existingPrompt?: {
    video_url: string;
    thumbnail_url?: string;
    duration_seconds: number;
    prompt_question?: string;
  } | null;
  onSaved?: () => void;
}

const MAX_DURATION = 15; // 15 seconds max

export const VideoPromptRecorder = ({
  userId,
  existingPrompt,
  onSaved,
}: VideoPromptRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(existingPrompt?.video_url || null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(existingPrompt?.thumbnail_url || null);
  const [duration, setDuration] = useState(existingPrompt?.duration_seconds || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 640 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (error) {
      toast({
        title: "Kamera Hatası",
        description: "Kameraya erişilemedi. Lütfen izin verin.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      generateThumbnail(url);
      stopCamera();
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

  const generateThumbnail = (url: string) => {
    const video = document.createElement("video");
    video.src = url;
    video.currentTime = 0.5;
    video.onloadeddata = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.8));
        }
      }
    };
  };

  const deleteRecording = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setThumbnailUrl(null);
    setDuration(0);
  };

  const retakeVideo = () => {
    deleteRecording();
    startCamera();
  };

  const saveRecording = async () => {
    if (!videoBlob) return;

    setIsSaving(true);
    try {
      const fileName = `video-prompt-${userId}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(`prompts/${fileName}`, videoBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(`prompts/${fileName}`);

      // Upload thumbnail if exists
      let savedThumbnailUrl = null;
      if (thumbnailUrl) {
        const thumbBlob = await fetch(thumbnailUrl).then((r) => r.blob());
        const thumbFileName = `thumb-${userId}-${Date.now()}.jpg`;
        const { error: thumbError } = await supabase.storage
          .from("videos")
          .upload(`prompts/thumbnails/${thumbFileName}`, thumbBlob);

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from("videos")
            .getPublicUrl(`prompts/thumbnails/${thumbFileName}`);
          savedThumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from("video_prompts").upsert({
        user_id: userId,
        video_url: urlData.publicUrl,
        thumbnail_url: savedThumbnailUrl,
        duration_seconds: duration,
      });

      if (dbError) throw dbError;

      toast({
        title: "Kayıt Başarılı",
        description: "Video tanıtımınız kaydedildi.",
      });
      onSaved?.();
    } catch (error) {
      console.error("Error saving video prompt:", error);
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
          <Video className="w-4 h-4" />
          Video Tanıtım
        </h3>
        <span className="text-sm text-muted-foreground">
          {formatTime(duration)} / {formatTime(MAX_DURATION)}
        </span>
      </div>

      <Progress value={(duration / MAX_DURATION) * 100} className="h-2" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Preview Area */}
      <div className="relative aspect-[9/16] max-h-[400px] bg-black rounded-lg overflow-hidden">
        {cameraReady && !videoUrl && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        {videoUrl && (
          <video
            ref={previewVideoRef}
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
          />
        )}
        {!cameraReady && !videoUrl && (
          <div className="flex items-center justify-center h-full">
            <Button onClick={startCamera} variant="outline" className="gap-2">
              <Video className="w-4 h-4" />
              Kamerayı Aç
            </Button>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
            REC
          </motion.div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {cameraReady && !videoUrl && (
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full w-14 h-14"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}

        {videoUrl && (
          <>
            <Button variant="outline" onClick={retakeVideo} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Tekrar Çek
            </Button>
            <Button variant="ghost" onClick={deleteRecording} className="text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* Save Button */}
      {videoBlob && (
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
          : videoUrl
          ? "Videonuzu izleyin veya yeniden kaydedin."
          : "15 saniyelik bir video tanıtım kaydedin."}
      </p>
    </Card>
  );
};
