import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface ShareableCardProps {
  title: string;
  content: string;
  username: string;
  analysisType?: string;
}

export const ShareableCard = ({ title, content, username, analysisType }: ShareableCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `${analysisType || 'analiz'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "İndirildi",
        description: "Görsel indirildi",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Hata",
        description: "Görsel oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${analysisType || 'analiz'}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: content.substring(0, 200),
          });
        } else {
          // Fallback to download if sharing not supported
          handleDownload();
        }
      });
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılamadı",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card ref={cardRef} className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-8 space-y-6">
          {/* Logo/Branding */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ✨ Falcım Sensin
            </div>
            <div className="text-sm text-muted-foreground">@{username}</div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center">{title}</h2>

          {/* Content */}
          <div className="bg-white/80 dark:bg-black/20 p-6 rounded-lg">
            <p className="text-base leading-relaxed whitespace-pre-line">
              {content.length > 400 ? content.substring(0, 400) + '...' : content}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            falcimsensin.app
          </div>
        </CardContent>
      </Card>

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
  );
};
