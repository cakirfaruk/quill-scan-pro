import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Simple install button for header/menu
 */
export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      toast({
        title: "🎉 Yükleme Başarılı!",
        description: "Uygulama ana ekranınıza eklendi",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA installation');
    }

    setDeferredPrompt(null);
  };

  // Show "Installed" button if already installed
  if (isInstalled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Yüklendi</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Uygulama zaten yüklü</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Don't show if install prompt not available
  if (!deferredPrompt) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="gap-2 border-primary/20 hover:border-primary/40"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ana Ekrana Ekle</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Uygulamayı yükle - hızlı erişim ve offline kullanım</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
