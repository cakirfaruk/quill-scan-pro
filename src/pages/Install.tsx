import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share, 
  Plus, 
  MoreVertical, 
  Smartphone, 
  Monitor,
  ArrowLeft,
  Apple,
  Chrome,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { CompactHeader } from "@/components/CompactHeader";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const features = [
    "Bildirimler ile hiçbir güncelleyi kaçırmayın",
    "Çevrimdışı olduğunuzda bile içeriklere erişin",
    "Daha hızlı açılış ve performans",
    "Ana ekranınızdan tek dokunuşla erişim",
    "Tarayıcı arayüzü olmadan tam ekran deneyim"
  ];

  return (
    <div className="min-h-screen bg-background">
      <CompactHeader />
      
      <div className="container max-w-lg mx-auto p-4 pb-24 pt-20 space-y-6">
        {/* Back Button & Title */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Uygulamayı Yükle</h1>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 pt-4"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Stellara'yı Yükle</h1>
          <p className="text-muted-foreground">
            Stellara'yı ana ekranınıza ekleyerek daha hızlı ve kolay erişim sağlayın.
          </p>
        </motion.div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="p-6 bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-600 dark:text-green-400">
                  Zaten Yüklendi!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stellara ana ekranınızda hazır.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Direct Install Button (Android/Desktop) */}
        {deferredPrompt && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full h-14 text-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Şimdi Yükle
            </Button>
          </motion.div>
        )}

        {/* Platform Specific Instructions */}
        {!isInstalled && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              {platform === 'ios' && <Apple className="w-5 h-5" />}
              {platform === 'android' && <Smartphone className="w-5 h-5" />}
              {platform === 'desktop' && <Monitor className="w-5 h-5" />}
              <h3 className="font-semibold">
                {platform === 'ios' && 'iPhone / iPad için Kurulum'}
                {platform === 'android' && 'Android için Kurulum'}
                {platform === 'desktop' && 'Masaüstü için Kurulum'}
                {platform === 'unknown' && 'Kurulum Adımları'}
              </h3>
            </div>

            {/* iOS Instructions */}
            {platform === 'ios' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Paylaş butonuna dokunun</p>
                    <p className="text-sm text-muted-foreground">
                      Safari'nin alt çubuğundaki <Share className="w-4 h-4 inline" /> simgesine dokunun
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Ana Ekrana Ekle'yi seçin</p>
                    <p className="text-sm text-muted-foreground">
                      Menüde aşağı kaydırın ve <Plus className="w-4 h-4 inline" /> "Ana Ekrana Ekle" seçeneğine dokunun
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Ekle'ye dokunun</p>
                    <p className="text-sm text-muted-foreground">
                      Sağ üst köşedeki "Ekle" butonuna dokunun
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && !deferredPrompt && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Menüyü açın</p>
                    <p className="text-sm text-muted-foreground">
                      Tarayıcının sağ üst köşesindeki <MoreVertical className="w-4 h-4 inline" /> simgesine dokunun
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">"Uygulamayı yükle" veya "Ana ekrana ekle" seçin</p>
                    <p className="text-sm text-muted-foreground">
                      Menüden bu seçeneklerden birini bulun ve dokunun
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Yükle'ye dokunun</p>
                    <p className="text-sm text-muted-foreground">
                      Açılan pencerede "Yükle" butonuna dokunun
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && !deferredPrompt && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Chrome className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Chrome / Edge kullanıyorsanız</p>
                    <p className="text-sm text-muted-foreground">
                      Adres çubuğunun sağındaki <Download className="w-4 h-4 inline" /> simgesine tıklayın veya menüden "Stellara'yı yükle" seçeneğini seçin
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Features */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Uygulama Özellikleri</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;
