import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";

interface ProfileQRCodeProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileQRCode = ({ username, isOpen, onClose }: ProfileQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { toast } = useToast();

  const profileUrl = `${window.location.origin}/profile/${username}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, username]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      await QRCode.toCanvas(canvasRef.current, profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Convert canvas to data URL for download
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Hata",
        description: "QR kod oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `${username}-qr-code.png`;
    link.href = qrDataUrl;
    link.click();

    toast({
      title: "İndirildi",
      description: "QR kod indirildi",
    });
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${username}-qr-code.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${username} - Profil QR Kodu`,
            text: `${username} kullanıcısının profilini görüntülemek için QR kodu tarayın`,
          });
        } else {
          handleDownload();
        }
      });
    } catch (error) {
      console.error("Error sharing QR code:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılamadı",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil QR Kodu</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <canvas ref={canvasRef} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Bu QR kodu tarayarak profilimi görüntüleyebilirsiniz
            </p>
          </div>

          {/* Profile URL */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-center break-all">{profileUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Paylaş
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
