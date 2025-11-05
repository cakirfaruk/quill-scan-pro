import { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sun,
  Contrast,
  Droplet,
  Sparkles,
  Check,
  X,
  Maximize2,
  RefreshCcw,
  Crop,
  Frame,
  Move,
  Type,
  Smile,
  Palette,
  Plus,
  Trash2,
  Heart,
  Star,
  Moon,
  Cloud,
  Zap,
  Music,
  Coffee,
  Gift,
  Flame,
  Snowflake,
  Umbrella,
  Crown,
  Rocket,
  Camera as CameraIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PhotoCaptureEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
  title?: string;
  description?: string;
}

export const PhotoCaptureEditor = ({
  open,
  onOpenChange,
  onCapture,
  title = "Fotoğraf Çek veya Yükle",
  description = "Kamera ile fotoğraf çekin veya galeriden seçin",
}: PhotoCaptureEditorProps) => {
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit controls
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<string>("none");
  const [frame, setFrame] = useState<string>("none");
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Text and emoji overlays
  interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
  }
  
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [newText, setNewText] = useState("");
  const [textFontSize, setTextFontSize] = useState(32);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState("Arial");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerCategory, setStickerCategory] = useState("love");
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Sticker library
  const stickerLibrary = {
    love: [
      { icon: Heart, label: "Kalp", color: "#ef4444" },
      { icon: Sparkles, label: "Işıltı", color: "#f59e0b" },
      { icon: Star, label: "Yıldız", color: "#fbbf24" },
      { icon: Crown, label: "Taç", color: "#fbbf24" },
    ],
    nature: [
      { icon: Sun, label: "Güneş", color: "#fbbf24" },
      { icon: Moon, label: "Ay", color: "#94a3b8" },
      { icon: Cloud, label: "Bulut", color: "#cbd5e1" },
      { icon: Snowflake, label: "Kar Tanesi", color: "#3b82f6" },
    ],
    fun: [
      { icon: Zap, label: "Şimşek", color: "#eab308" },
      { icon: Flame, label: "Ateş", color: "#f97316" },
      { icon: Music, label: "Müzik", color: "#8b5cf6" },
      { icon: Rocket, label: "Roket", color: "#06b6d4" },
    ],
    items: [
      { icon: Coffee, label: "Kahve", color: "#92400e" },
      { icon: Gift, label: "Hediye", color: "#db2777" },
      { icon: Umbrella, label: "Şemsiye", color: "#0ea5e9" },
      { icon: CameraIcon, label: "Kamera", color: "#64748b" },
    ],
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && activeTab === "camera") {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, activeTab]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Kamera Hatası",
        description: "Kameraya erişilemedi. Lütfen izinleri kontrol edin.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(imageData);
    setIsEditing(true);
    stopCamera();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropMouseDown = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === "move") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsResizing(action);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropContainerRef.current) return;
    
    const rect = cropContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (isDragging) {
      setCropArea((prev) => {
        const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaX));
        const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaY));
        return { ...prev, x: newX, y: newY };
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      setCropArea((prev) => {
        let newArea = { ...prev };
        
        switch (isResizing) {
          case "nw":
            newArea.x = Math.max(0, prev.x + deltaX);
            newArea.y = Math.max(0, prev.y + deltaY);
            newArea.width = Math.max(10, prev.width - deltaX);
            newArea.height = Math.max(10, prev.height - deltaY);
            break;
          case "ne":
            newArea.y = Math.max(0, prev.y + deltaY);
            newArea.width = Math.min(100 - prev.x, Math.max(10, prev.width + deltaX));
            newArea.height = Math.max(10, prev.height - deltaY);
            break;
          case "sw":
            newArea.x = Math.max(0, prev.x + deltaX);
            newArea.width = Math.max(10, prev.width - deltaX);
            newArea.height = Math.min(100 - prev.y, Math.max(10, prev.height + deltaY));
            break;
          case "se":
            newArea.width = Math.min(100 - prev.x, Math.max(10, prev.width + deltaX));
            newArea.height = Math.min(100 - prev.y, Math.max(10, prev.height + deltaY));
            break;
        }

        // Apply aspect ratio constraint
        if (aspectRatio) {
          const currentRatio = newArea.width / newArea.height;
          if (Math.abs(currentRatio - aspectRatio) > 0.01) {
            if (isResizing === "se" || isResizing === "ne") {
              newArea.height = newArea.width / aspectRatio;
            } else if (isResizing === "sw" || isResizing === "nw") {
              newArea.width = newArea.height * aspectRatio;
            }
          }
        }

        // Ensure crop area stays within bounds
        if (newArea.x + newArea.width > 100) {
          newArea.width = 100 - newArea.x;
          if (aspectRatio) newArea.height = newArea.width / aspectRatio;
        }
        if (newArea.y + newArea.height > 100) {
          newArea.height = 100 - newArea.y;
          if (aspectRatio) newArea.width = newArea.height * aspectRatio;
        }

        return newArea;
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const setAspectRatioAndAdjustCrop = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio) {
      setCropArea((prev) => {
        let newArea = { ...prev };
        const currentRatio = prev.width / prev.height;
        
        if (currentRatio > ratio) {
          // Too wide, adjust width
          newArea.width = prev.height * ratio;
        } else {
          // Too tall, adjust height
          newArea.height = prev.width / ratio;
        }

        // Center if needed
        if (newArea.x + newArea.width > 100) {
          newArea.x = 100 - newArea.width;
        }
        if (newArea.y + newArea.height > 100) {
          newArea.y = 100 - newArea.height;
        }

        return newArea;
      });
    }
  };

  const applyCrop = () => {
    if (!capturedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const img = new Image();
    img.src = capturedImage;

    img.onload = () => {
      const scaleX = img.width / 100;
      const scaleY = img.height / 100;
      
      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;
      const cropWidth = cropArea.width * scaleX;
      const cropHeight = cropArea.height * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      context.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImage = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedImage(croppedImage);
      setIsCropping(false);
      setCropArea({ x: 10, y: 10, width: 80, height: 80 });
      setAspectRatio(null);
      
      toast({
        title: "Kırpma Başarılı",
        description: "Fotoğraf kırpıldı",
      });
    };
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: newText,
      x: 50,
      y: 50,
      fontSize: textFontSize,
      color: textColor,
      fontFamily: textFont,
    };
    
    setTextOverlays([...textOverlays, newOverlay]);
    setNewText("");
    setIsAddingText(false);
    
    toast({
      title: "Metin Eklendi",
      description: "Metni sürükleyerek konumlandırabilirsiniz",
    });
  };

  const addEmojiOverlay = (emojiData: EmojiClickData) => {
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: emojiData.emoji,
      x: 50,
      y: 50,
      fontSize: 48,
      color: "#000000",
      fontFamily: "Arial",
    };
    
    setTextOverlays([...textOverlays, newOverlay]);
    setShowEmojiPicker(false);
    
    toast({
      title: "Emoji Eklendi",
      description: "Emoji'yi sürükleyerek konumlandırabilirsiniz",
    });
  };

  const addStickerOverlay = (sticker: { icon: any; label: string; color: string }) => {
    const StickerIcon = sticker.icon;
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${sticker.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`;
    
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: `[STICKER:${sticker.label}]`,
      x: 50,
      y: 50,
      fontSize: 64,
      color: sticker.color,
      fontFamily: sticker.label,
    };
    
    setTextOverlays([...textOverlays, newOverlay]);
    setShowStickerPicker(false);
    
    toast({
      title: "Sticker Eklendi",
      description: "Sticker'ı sürükleyerek konumlandırabilirsiniz",
    });
  };

  const deleteTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    setSelectedTextId(null);
  };

  const handleTextMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingTextId(id);
    setSelectedTextId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTextMouseMove = (e: React.MouseEvent) => {
    if (!draggingTextId || !cropContainerRef.current) return;
    
    const rect = cropContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === draggingTextId
        ? {
            ...overlay,
            x: Math.max(0, Math.min(100, overlay.x + deltaX)),
            y: Math.max(0, Math.min(100, overlay.y + deltaY))
          }
        : overlay
    ));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTextMouseUp = () => {
    setDraggingTextId(null);
  };

  const applyFilters = () => {
    if (!capturedImage || !canvasRef.current) return capturedImage;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return capturedImage;

    const img = new Image();
    img.src = capturedImage;

    return new Promise<string>((resolve) => {
      img.onload = () => {
        // Apply rotation
        const rotRad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rotRad));
        const cos = Math.abs(Math.cos(rotRad));
        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;

        canvas.width = newWidth * zoom;
        canvas.height = newHeight * zoom;

        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(rotRad);
        context.scale(zoom, zoom);
        context.translate(-img.width / 2, -img.height / 2);

        // Apply filters
        let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        if (filter !== "none") {
          switch (filter) {
            case "grayscale":
              filterString += " grayscale(100%)";
              break;
            case "sepia":
              filterString += " sepia(100%)";
              break;
            case "vintage":
              filterString += " sepia(50%) contrast(110%) brightness(90%)";
              break;
            case "cool":
              filterString += " hue-rotate(180deg)";
              break;
            case "warm":
              filterString += " sepia(30%) saturate(130%)";
              break;
          }
        }

        context.filter = filterString;
        context.drawImage(img, 0, 0);
        
        // Apply frame
        if (frame !== "none") {
          context.filter = "none";
          const frameWidth = canvas.width;
          const frameHeight = canvas.height;
          
          switch (frame) {
            case "classic":
              context.strokeStyle = "#8B4513";
              context.lineWidth = 20;
              context.strokeRect(10, 10, frameWidth - 20, frameHeight - 20);
              context.strokeStyle = "#D2691E";
              context.lineWidth = 10;
              context.strokeRect(15, 15, frameWidth - 30, frameHeight - 30);
              break;
            case "modern":
              context.strokeStyle = "#000000";
              context.lineWidth = 30;
              context.strokeRect(0, 0, frameWidth, frameHeight);
              context.strokeStyle = "#FFFFFF";
              context.lineWidth = 2;
              context.strokeRect(28, 28, frameWidth - 56, frameHeight - 56);
              break;
            case "vintage":
              const gradient = context.createLinearGradient(0, 0, frameWidth, frameHeight);
              gradient.addColorStop(0, "#8B7355");
              gradient.addColorStop(1, "#D2B48C");
              context.strokeStyle = gradient;
              context.lineWidth = 40;
              context.strokeRect(0, 0, frameWidth, frameHeight);
              context.strokeStyle = "#F5DEB3";
              context.lineWidth = 5;
              context.strokeRect(35, 35, frameWidth - 70, frameHeight - 70);
              break;
            case "polaroid":
              context.fillStyle = "#FFFFFF";
              const borderSize = Math.min(frameWidth, frameHeight) * 0.08;
              context.fillRect(0, 0, frameWidth, borderSize);
              context.fillRect(0, 0, borderSize, frameHeight);
              context.fillRect(frameWidth - borderSize, 0, borderSize, frameHeight);
              context.fillRect(0, frameHeight - borderSize * 2, frameWidth, borderSize * 2);
              break;
            case "gold":
              const goldGradient = context.createLinearGradient(0, 0, frameWidth, 0);
              goldGradient.addColorStop(0, "#FFD700");
              goldGradient.addColorStop(0.5, "#FFA500");
              goldGradient.addColorStop(1, "#FFD700");
              context.strokeStyle = goldGradient;
              context.lineWidth = 25;
              context.strokeRect(0, 0, frameWidth, frameHeight);
              context.strokeStyle = "#DAA520";
              context.lineWidth = 5;
              context.strokeRect(22, 22, frameWidth - 44, frameHeight - 44);
              break;
          }
        }
        
        context.restore();

        // Draw text overlays
        textOverlays.forEach(overlay => {
          context.save();
          
          const x = (overlay.x / 100) * canvas.width;
          const y = (overlay.y / 100) * canvas.height;
          const size = overlay.fontSize * (canvas.width / 100);
          
          // Check if it's a sticker
          if (overlay.text.startsWith("[STICKER:")) {
            const stickerName = overlay.fontFamily;
            let stickerIcon = null;
            
            // Find the sticker from library
            Object.values(stickerLibrary).forEach(category => {
              const found = category.find(s => s.label === stickerName);
              if (found) stickerIcon = found;
            });
            
            if (stickerIcon) {
              const StickerComponent = stickerIcon.icon;
              
              // Create a temporary SVG element
              const tempCanvas = document.createElement("canvas");
              const tempCtx = tempCanvas.getContext("2d");
              tempCanvas.width = size;
              tempCanvas.height = size;
              
              if (tempCtx) {
                // Draw icon using canvas (simplified icon representation)
                tempCtx.strokeStyle = overlay.color;
                tempCtx.fillStyle = overlay.color;
                tempCtx.lineWidth = 3;
                
                // Draw icon based on type (simplified representations)
                if (stickerName === "Kalp") {
                  tempCtx.beginPath();
                  tempCtx.moveTo(size / 2, size * 0.3);
                  tempCtx.bezierCurveTo(size * 0.2, size * 0.1, size * 0.1, size * 0.3, size / 2, size * 0.8);
                  tempCtx.bezierCurveTo(size * 0.9, size * 0.3, size * 0.8, size * 0.1, size / 2, size * 0.3);
                  tempCtx.fill();
                } else if (stickerName === "Yıldız") {
                  const spikes = 5;
                  const outerRadius = size / 2;
                  const innerRadius = size / 4;
                  tempCtx.beginPath();
                  for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const px = size / 2 + Math.cos(angle - Math.PI / 2) * radius;
                    const py = size / 2 + Math.sin(angle - Math.PI / 2) * radius;
                    if (i === 0) tempCtx.moveTo(px, py);
                    else tempCtx.lineTo(px, py);
                  }
                  tempCtx.closePath();
                  tempCtx.fill();
                } else {
                  // Generic circle for other stickers
                  tempCtx.beginPath();
                  tempCtx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
                  tempCtx.fill();
                }
                
                context.drawImage(tempCanvas, x - size / 2, y - size / 2);
              }
            }
          } else {
            // Regular text
            context.font = `${size}px ${overlay.fontFamily}`;
            context.fillStyle = overlay.color;
            context.textAlign = "center";
            context.textBaseline = "middle";
            
            // Add text shadow for better readability
            context.shadowColor = "rgba(0, 0, 0, 0.8)";
            context.shadowBlur = 4;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            
            context.fillText(overlay.text, x, y);
          }
          
          context.restore();
        });

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
    });
  };

  const handleSave = async () => {
    const finalImage = await applyFilters();
    onCapture(finalImage);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setIsEditing(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setZoom(1);
    setFilter("none");
    setFrame("none");
    setIsCropping(false);
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    setAspectRatio(null);
    setIsDragging(false);
    setIsResizing(null);
    setTextOverlays([]);
    setSelectedTextId(null);
    setIsAddingText(false);
    setNewText("");
    if (activeTab === "camera") {
      startCamera();
    }
  };

  const handleCancel = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "gallery")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="gap-2">
                <Camera className="w-4 h-4" />
                Kamera
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Galeri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    className="rounded-full w-16 h-16 bg-white hover:bg-gray-100"
                  >
                    <div className="w-14 h-14 rounded-full border-4 border-black" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Galeriden Fotoğraf Seç</p>
                <p className="text-sm text-muted-foreground">Tıklayın veya sürükleyip bırakın</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div 
                ref={cropContainerRef}
                className="relative w-full h-full select-none"
                onMouseMove={(e) => {
                  handleCropMouseMove(e);
                  handleTextMouseMove(e);
                }}
                onMouseUp={() => {
                  handleCropMouseUp();
                  handleTextMouseUp();
                }}
                onMouseLeave={() => {
                  handleCropMouseUp();
                  handleTextMouseUp();
                }}
              >
                <img
                  src={capturedImage || ""}
                  alt="Preview"
                  className="w-full h-full object-contain pointer-events-none"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                  }}
                />
                {isCropping && (
                  <div className="absolute inset-0 bg-black/50">
                    <div
                      className="absolute border-2 border-primary shadow-lg backdrop-blur-sm bg-primary/10"
                      style={{
                        left: `${cropArea.x}%`,
                        top: `${cropArea.y}%`,
                        width: `${cropArea.width}%`,
                        height: `${cropArea.height}%`,
                      }}
                      onMouseDown={(e) => handleCropMouseDown(e, "move")}
                    >
                      {/* Grid lines */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="border border-white/30" />
                        ))}
                      </div>
                      
                      {/* Corner handles */}
                      <div 
                        className="absolute top-0 left-0 w-4 h-4 bg-primary border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCropMouseDown(e, "nw")}
                      />
                      <div 
                        className="absolute top-0 right-0 w-4 h-4 bg-primary border-2 border-white rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCropMouseDown(e, "ne")}
                      />
                      <div 
                        className="absolute bottom-0 left-0 w-4 h-4 bg-primary border-2 border-white rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCropMouseDown(e, "sw")}
                      />
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 bg-primary border-2 border-white rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCropMouseDown(e, "se")}
                      />
                      
                      {/* Move icon in center */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <Move className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Text and Sticker Overlays */}
                {textOverlays.map((overlay) => {
                  // Check if it's a sticker
                  const isSticker = overlay.text.startsWith("[STICKER:");
                  let StickerIcon = null;
                  
                  if (isSticker) {
                    const stickerName = overlay.fontFamily;
                    Object.values(stickerLibrary).forEach(category => {
                      const found = category.find(s => s.label === stickerName);
                      if (found) StickerIcon = found.icon;
                    });
                  }
                  
                  return (
                    <div
                      key={overlay.id}
                      className={cn(
                        "absolute cursor-move select-none transition-shadow",
                        selectedTextId === overlay.id && "ring-2 ring-primary shadow-lg rounded-lg"
                      )}
                      style={{
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontSize: `${overlay.fontSize}px`,
                        color: overlay.color,
                        fontFamily: overlay.fontFamily,
                        textShadow: !isSticker ? "2px 2px 4px rgba(0, 0, 0, 0.8)" : "none",
                      }}
                      onMouseDown={(e) => handleTextMouseDown(e, overlay.id)}
                    >
                      {isSticker && StickerIcon ? (
                        <StickerIcon 
                          size={overlay.fontSize} 
                          color={overlay.color}
                          fill={overlay.color}
                          strokeWidth={2}
                        />
                      ) : (
                        overlay.text
                      )}
                      {selectedTextId === overlay.id && (
                        <button
                          className="absolute -top-3 -right-3 bg-destructive text-white rounded-full p-1 hover:scale-110 transition-transform z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTextOverlay(overlay.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Text Controls */}
            {!isCropping && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={isAddingText ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAddingText(!isAddingText)}
                    className="gap-2"
                  >
                    <Type className="w-4 h-4" />
                    Metin Ekle
                  </Button>

                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Smile className="w-4 h-4" />
                        Emoji
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <EmojiPicker onEmojiClick={addEmojiOverlay} />
                    </PopoverContent>
                  </Popover>

                  <Popover open={showStickerPicker} onOpenChange={setShowStickerPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Sticker
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                      <div className="space-y-4">
                        <div className="flex gap-2 border-b pb-2">
                          <Button
                            variant={stickerCategory === "love" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStickerCategory("love")}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={stickerCategory === "nature" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStickerCategory("nature")}
                          >
                            <Sun className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={stickerCategory === "fun" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStickerCategory("fun")}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={stickerCategory === "items" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStickerCategory("items")}
                          >
                            <Coffee className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {stickerLibrary[stickerCategory as keyof typeof stickerLibrary].map((sticker, idx) => {
                            const StickerIcon = sticker.icon;
                            return (
                              <button
                                key={idx}
                                onClick={() => addStickerOverlay(sticker)}
                                className="p-3 rounded-lg border hover:border-primary hover:bg-accent transition-all flex flex-col items-center gap-1"
                              >
                                <StickerIcon size={32} color={sticker.color} strokeWidth={2} />
                                <span className="text-xs text-muted-foreground">{sticker.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {isAddingText && (
                  <div className="space-y-3 p-4 border rounded-lg bg-card">
                    <div className="space-y-2">
                      <Label>Metin</Label>
                      <Input
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Metninizi yazın..."
                        onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Font</Label>
                        <select
                          value={textFont}
                          onChange={(e) => setTextFont(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                          <option value="Impact">Impact</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Boyut: {textFontSize}px</Label>
                        <Slider
                          value={[textFontSize]}
                          onValueChange={(v) => setTextFontSize(v[0])}
                          min={16}
                          max={120}
                          step={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Renk
                      </Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-12 h-9 rounded cursor-pointer"
                        />
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={addTextOverlay}
                      className="w-full gap-2 bg-gradient-primary"
                      disabled={!newText.trim()}
                    >
                      <Plus className="w-4 h-4" />
                      Metni Ekle
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Edit Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brightness */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Parlaklık
                </Label>
                <Slider
                  value={[brightness]}
                  onValueChange={(v) => setBrightness(v[0])}
                  min={0}
                  max={200}
                  step={1}
                />
                <span className="text-xs text-muted-foreground">{brightness}%</span>
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  Kontrast
                </Label>
                <Slider
                  value={[contrast]}
                  onValueChange={(v) => setContrast(v[0])}
                  min={0}
                  max={200}
                  step={1}
                />
                <span className="text-xs text-muted-foreground">{contrast}%</span>
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  Doygunluk
                </Label>
                <Slider
                  value={[saturation]}
                  onValueChange={(v) => setSaturation(v[0])}
                  min={0}
                  max={200}
                  step={1}
                />
                <span className="text-xs text-muted-foreground">{saturation}%</span>
              </div>

              {/* Zoom */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Yakınlaştırma
                </Label>
                <Slider
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                />
                <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
              </div>
            </div>

            {/* Crop Controls */}
            {isCropping && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  En-Boy Oranı
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={aspectRatio === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatioAndAdjustCrop(null)}
                  >
                    Serbest
                  </Button>
                  <Button
                    variant={aspectRatio === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatioAndAdjustCrop(1)}
                  >
                    1:1 (Kare)
                  </Button>
                  <Button
                    variant={aspectRatio === 4/3 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatioAndAdjustCrop(4/3)}
                  >
                    4:3
                  </Button>
                  <Button
                    variant={aspectRatio === 16/9 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatioAndAdjustCrop(16/9)}
                  >
                    16:9
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isCropping ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsCropping(!isCropping);
                  if (!isCropping) {
                    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
                    setAspectRatio(null);
                  }
                }}
                className="gap-2"
              >
                <Crop className="w-4 h-4" />
                {isCropping ? "Kırpmayı İptal Et" : "Kırp"}
              </Button>

              {isCropping && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyCrop}
                  className="gap-2 bg-gradient-primary"
                >
                  <Check className="w-4 h-4" />
                  Kırpmayı Uygula
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="gap-2"
                disabled={isCropping}
              >
                <RotateCw className="w-4 h-4" />
                Döndür
              </Button>

              <Button
                variant={filter === "none" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("none")}
              >
                Normal
              </Button>
              <Button
                variant={filter === "grayscale" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("grayscale")}
              >
                Siyah-Beyaz
              </Button>
              <Button
                variant={filter === "sepia" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("sepia")}
              >
                Sepia
              </Button>
              <Button
                variant={filter === "vintage" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("vintage")}
              >
                Vintage
              </Button>
              <Button
                variant={filter === "warm" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("warm")}
              >
                Sıcak
              </Button>
              <Button
                variant={filter === "cool" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilter("cool")}
                disabled={isCropping}
              >
                Soğuk
              </Button>
            </div>

            {/* Frame Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Frame className="w-4 h-4" />
                Çerçeve
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={frame === "none" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("none")}
                  disabled={isCropping}
                >
                  Yok
                </Button>
                <Button
                  variant={frame === "classic" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("classic")}
                  disabled={isCropping}
                >
                  Klasik
                </Button>
                <Button
                  variant={frame === "modern" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("modern")}
                  disabled={isCropping}
                >
                  Modern
                </Button>
                <Button
                  variant={frame === "vintage" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("vintage")}
                  disabled={isCropping}
                >
                  Vintage
                </Button>
                <Button
                  variant={frame === "polaroid" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("polaroid")}
                  disabled={isCropping}
                >
                  Polaroid
                </Button>
                <Button
                  variant={frame === "gold" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFrame("gold")}
                  disabled={isCropping}
                >
                  Altın
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2 ml-auto"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Sıfırla
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
          {isEditing && (
            <Button onClick={handleSave} className="bg-gradient-primary">
              <Check className="w-4 h-4 mr-2" />
              Kaydet ve Kullan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
