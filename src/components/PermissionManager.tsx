import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Camera, Image, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const PermissionManager = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    mediaLibrary: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're running as installed PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    // Check if permissions have been requested before
    const permissionsRequested = localStorage.getItem("permissions-requested");
    
    if (isInstalled && !permissionsRequested) {
      // Show dialog after a short delay for better UX
      setTimeout(() => {
        setShowDialog(true);
      }, 1000);
    }

    // Check current permissions
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // Check notification permission
    if ('Notification' in window) {
      setPermissions(prev => ({
        ...prev,
        notifications: Notification.permission === 'granted'
      }));
    }

    // Camera and media permissions are checked when requested
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Desteklenmiyor",
        description: "Tarayıcınız bildirim özelliğini desteklemiyor",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setPermissions(prev => ({ ...prev, notifications: granted }));
      
      if (granted) {
        toast({
          title: "Bildirimler Açıldı",
          description: "Artık önemli güncellemeleri göreceksiniz",
        });
        
        // Test notification
        new Notification("KAM Bildirimler Aktif", {
          body: "Artık tüm bildirimleri alacaksınız!",
          icon: "/favicon.ico",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, camera: true }));
      toast({
        title: "Kamera İzni Verildi",
        description: "Artık kamera özelliklerini kullanabilirsiniz",
      });
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      toast({
        title: "Kamera İzni Reddedildi",
        description: "Kamera özelliklerini kullanmak için izin gerekli",
        variant: "destructive",
      });
      return false;
    }
  };

  const requestMediaLibrary = () => {
    // For media library, we just show that the feature is available
    // Actual permission is requested when user tries to upload
    setPermissions(prev => ({ ...prev, mediaLibrary: true }));
    toast({
      title: "Galeri Erişimi Hazır",
      description: "Fotoğraf yüklerken izin istenecek",
    });
    return true;
  };

  const requestAllPermissions = async () => {
    await requestNotifications();
    await requestCamera();
    requestMediaLibrary();
    
    // Mark that permissions have been requested
    localStorage.setItem("permissions-requested", "true");
    setShowDialog(false);
    
    toast({
      title: "İzinler Ayarlandı",
      description: "Uygulama özelliklerinden tam olarak yararlanabilirsiniz",
    });
  };

  const skipPermissions = () => {
    localStorage.setItem("permissions-requested", "true");
    setShowDialog(false);
    toast({
      title: "İzinler Atlandı",
      description: "Ayarlardan istediğiniz zaman izinleri verebilirsiniz",
    });
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Uygulama İzinleri</DialogTitle>
          <DialogDescription className="text-base pt-2">
            KAM uygulamasının tüm özelliklerinden yararlanmak için aşağıdaki izinlere ihtiyacımız var
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                Bildirimler
                {permissions.notifications && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                Önemli güncellemeler, mesajlar ve analizler için
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                Kamera
                {permissions.camera && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                El yazısı ve kahve fincanı fotoğrafları için
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                Galeri
                {permissions.mediaLibrary && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                Galeriden fotoğraf seçmek için
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={requestAllPermissions} className="w-full">
            Tüm İzinleri Ver
          </Button>
          <Button onClick={skipPermissions} variant="outline" className="w-full">
            Şimdi Değil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
