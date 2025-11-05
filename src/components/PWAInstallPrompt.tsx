import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useNavigate } from "react-router-dom";

export const PWAInstallPrompt = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) return null;

  // Show different UI for iOS vs Android
  if (isIOS && !canInstall) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md p-4 shadow-lg z-50 animate-in slide-in-from-bottom-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Uygulamayı Yükle</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ana ekranınıza ekleyin ve daha hızlı erişin
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate('/install')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Nasıl Yapılır?
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
              >
                Daha Sonra
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Android/Desktop with install prompt
  if (canInstall) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md p-4 shadow-lg z-50 animate-in slide-in-from-bottom-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Uygulamayı Yükle</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Cihazınıza kurun, çevrimdışı kullanın
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={promptInstall}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Yükle
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
              >
                Daha Sonra
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return null;
};
