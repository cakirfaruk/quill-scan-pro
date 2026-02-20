import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">Uygulamayı Yükle</CardTitle>
          <CardDescription className="text-base">
            Astro Social'ı telefonunuza kurun ve her zaman erişilebilir olsun
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Uygulama Kuruldu! 🎉</h3>
                <p className="text-muted-foreground">
                  Artık ana ekranınızdan Astro Social'a erişebilirsiniz
                </p>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Uygulamaya Git
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Ana Ekrana Ekle</h4>
                    <p className="text-sm text-muted-foreground">
                      Telefonunuzun ana ekranından tek dokunuşla erişin
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Çevrimdışı Çalışır</h4>
                    <p className="text-sm text-muted-foreground">
                      İnternet bağlantısı olmadan bile uygulamayı kullanabilirsiniz
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Hızlı ve Güvenli</h4>
                    <p className="text-sm text-muted-foreground">
                      Native uygulama deneyimi, güvenli ve hızlı
                    </p>
                  </div>
                </div>
              </div>

              {/* Install Instructions */}
              <div className="border-t pt-6">
                {deferredPrompt ? (
                  <Button
                    onClick={handleInstall}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    <Download className="mr-2 w-5 h-5" />
                    Şimdi Yükle
                  </Button>
                ) : isIOS ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-center">iPhone/iPad'de Nasıl Kurulur</h4>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Safari tarayıcısında bu sayfayı açın</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Aşağıdaki <strong>Paylaş</strong> butonuna dokunun</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span><strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span><strong>"Ekle"</strong> butonuna dokunun</span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-center">Android'de Nasıl Kurulur</h4>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Chrome veya Firefox tarayıcısında bu sayfayı açın</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Sağ üstteki <strong>menü</strong> butonuna dokunun (⋮)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span><strong>"Ana ekrana ekle"</strong> veya <strong>"Yükle"</strong> seçeneğini seçin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span><strong>"Ekle"</strong> veya <strong>"Yükle"</strong> butonuna dokunun</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Daha Sonra
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
