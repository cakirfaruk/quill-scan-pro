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
              <img
                src={capturedImage || ""}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                }}
              />
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
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="gap-2"
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
              >
                Soğuk
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
