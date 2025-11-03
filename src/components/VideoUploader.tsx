import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Upload, X, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  onUploadComplete?: (videoUrl: string, thumbnailUrl: string) => void;
  className?: string;
}

export const VideoUploader = ({ onUploadComplete, className }: VideoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Geçersiz dosya",
        description: "Lütfen bir video dosyası seçin.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Video boyutu maksimum 500MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const generateThumbnail = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      video.preload = "metadata";
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Capture at 1 second
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error("Failed to generate thumbnail"));
          }
        }, "image/jpeg", 0.8);
      };

      video.onerror = () => reject(new Error("Failed to load video"));
    });
  };

  const handleUpload = async () => {
    if (!selectedVideo) {
      toast({
        title: "Video seçin",
        description: "Lütfen yüklemek için bir video seçin.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      // Simulate progress for thumbnail generation
      setUploadProgress(10);
      const thumbnailBase64 = await generateThumbnail(selectedVideo);
      
      setUploadProgress(20);
      
      // Upload video
      const videoFileName = `${user.id}/${Date.now()}-${selectedVideo.name}`;
      
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(uploadInterval);
            return 80;
          }
          return prev + 5;
        });
      }, 200);

      const { data: videoData, error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, selectedVideo, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(uploadInterval);
      if (videoError) throw videoError;

      setUploadProgress(85);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(videoData.path);

      setUploadProgress(90);

      // Save to database
      const { data: videoRecord, error: dbError } = await supabase
        .from("user_videos")
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          thumbnail_url: thumbnailBase64,
          title: title || "Başlıksız Video",
          description: description || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Video yüklendi!",
        description: "Videonuz başarıyla yüklendi.",
      });

      onUploadComplete?.(publicUrl, thumbnailBase64);
      
      // Reset form
      setSelectedVideo(null);
      setVideoPreview(null);
      setTitle("");
      setDescription("");
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Yükleme hatası",
        description: error.message || "Video yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {!videoPreview ? (
        <Button
          variant="outline"
          className="w-full h-32 border-2 border-dashed hover:border-primary transition-colors"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center gap-2">
            <Video className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm">Video Seç</span>
            <span className="text-xs text-muted-foreground">Maks. 500MB</span>
          </div>
        </Button>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            src={videoPreview}
            controls
            className="w-full max-h-64 object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
            onClick={clearSelection}
            disabled={isUploading}
          >
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>
      )}

      {selectedVideo && (
        <div className="space-y-3">
          <Input
            placeholder="Video başlığı (opsiyonel)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
          />
          <Textarea
            placeholder="Video açıklaması (opsiyonel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            rows={3}
          />
          
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Yükleniyor... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Yükleniyor..." : "Videoyu Yükle"}
          </Button>
        </div>
      )}
    </div>
  );
};
