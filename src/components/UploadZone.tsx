import { useCallback, useState } from "react";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFileSelect: (file: File, preview: string) => void;
}

export const UploadZone = ({ onFileSelect }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Geçersiz dosya tipi",
        description: "Lütfen JPG, PNG, WEBP veya PDF dosyası yükleyin.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "Dosya çok büyük",
        description: "Dosya boyutu 20MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    if (file.type === "application/pdf") {
      // For PDFs, create a placeholder preview
      const preview = "pdf";
      onFileSelect(file, preview);
    } else {
      // For images, create a data URL preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onFileSelect(file, preview);
      };
      reader.readAsDataURL(file);
    }

    toast({
      title: "Dosya yüklendi",
      description: "El yazısı analizi için hazır.",
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed 
        transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border bg-card hover:border-primary/50 hover:shadow-card"
        }
      `}
    >
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5 md:space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-4 sm:p-5 md:p-6 rounded-full">
            <Upload className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-xl sm:text-xl md:text-2xl font-bold text-foreground">
            El Yazısı Yükleyin
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md px-2">
            Analiz edilecek el yazısı görselini veya PDF dosyasını sürükleyip bırakın ya da tıklayarak seçin
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>JPG, PNG, WEBP</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Maksimum dosya boyutu: 20MB
        </p>
      </div>
    </div>
  );
};
