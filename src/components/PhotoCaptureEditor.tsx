import { useState, useRef, useEffect } from "react";
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
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });

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
      setCropArea({ x: 0, y: 0, width: 100, height: 100 });
      
      toast({
        title: "Kırpma Başarılı",
        description: "Fotoğraf kırpıldı",
      });
    };
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
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
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
              <div className="relative w-full h-full">
                <img
                  src={capturedImage || ""}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                  }}
                />
                {isCropping && (
                  <div className="absolute inset-0 bg-black/50">
                    <div
                      className="absolute border-2 border-white shadow-lg cursor-move"
                      style={{
                        left: `${cropArea.x}%`,
                        top: `${cropArea.y}%`,
                        width: `${cropArea.width}%`,
                        height: `${cropArea.height}%`,
                      }}
                    >
                      <div className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" />
                      <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 bg-white rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize" />
                    </div>
                  </div>
                )}
              </div>
            </div>

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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isCropping ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCropping(!isCropping)}
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
