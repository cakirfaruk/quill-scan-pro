import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface UseShareReturn {
  share: (data: ShareData) => Promise<boolean>;
  isSupported: boolean;
  isSharing: boolean;
}

export const useShare = (): UseShareReturn => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Check if Web Share API is supported
  const isSupported = typeof navigator !== 'undefined' && 'share' in navigator;

  const share = async (data: ShareData): Promise<boolean> => {
    setIsSharing(true);

    try {
      // If Web Share API is supported, use it
      if (isSupported) {
        // Check if we can share files
        const canShareFiles = data.files && data.files.length > 0 && navigator.canShare?.({ files: data.files });

        const shareData: ShareData = {
          title: data.title,
          text: data.text,
          url: data.url,
        };

        // Only include files if supported
        if (canShareFiles) {
          shareData.files = data.files;
        }

        await navigator.share(shareData);
        
        toast({
          title: "Başarıyla paylaşıldı!",
          description: "Analiz sonuçlarınız paylaşıldı.",
        });

        return true;
      } else {
        // Fallback: Copy to clipboard
        const textToCopy = [data.title, data.text, data.url].filter(Boolean).join('\n\n');
        
        await navigator.clipboard.writeText(textToCopy);
        
        toast({
          title: "Panoya kopyalandı!",
          description: "Analiz sonuçları kopyalandı, istediğiniz yere yapıştırabilirsiniz.",
        });

        return true;
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        toast({
          title: "Paylaşım başarısız",
          description: "Bir hata oluştu, lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    share,
    isSupported,
    isSharing,
  };
};
