import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Camera, Image, Check, X, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const PermissionSettings = () => {
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    mediaLibrary: false,
  });
  const { toast } = useToast();

  useEffect(() => {
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

    // Camera permission - we check if we have access
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      setPermissions(prev => ({ ...prev, camera: hasCamera }));
    } catch {
      setPermissions(prev => ({ ...prev, camera: false }));
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Desteklenmiyor",
        description: "Tarayıcınız bildirim özelliğini desteklemiyor",
        variant: "destructive",
      });
      return;
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
        new Notification("Bildirimler Aktif", {
          body: "Artık tüm bildirimleri alacaksınız!",
          icon: "/favicon.ico",
        });
      } else {
        toast({
          title: "İzin Reddedildi",
          description: "Tarayıcı ayarlarından izin verebilirsiniz",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      toast({
        title: "Hata",
        description: "Bildirim izni alınamadı",
        variant: "destructive",
      });
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Immediately stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, camera: true }));
      toast({
        title: "Kamera İzni Verildi",
        description: "Artık kamera özelliklerini kullanabilirsiniz",
      });
    } catch (error) {
      console.error('Camera permission error:', error);
      toast({
        title: "Kamera İzni Reddedildi",
        description: "Tarayıcı ayarlarından kamera iznini verebilirsiniz",
        variant: "destructive",
      });
    }
  };

  const revokeNotifications = () => {
    toast({
      title: "Bildirimleri Kapatma",
      description: "Tarayıcı ayarlarından site izinlerini yönetebilirsiniz:\n\n" +
                   "Chrome: Adres çubuğundaki 🔒 → Site ayarları → Bildirimler\n" +
                   "Safari: Safari → Tercihler → Web Siteleri → Bildirimler",
      duration: 8000,
    });
  };

  const resetPermissions = () => {
    localStorage.removeItem("permissions-requested");
    toast({
      title: "İzinler Sıfırlandı",
      description: "Uygulamayı yeniden açtığınızda izinler tekrar istenecek",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          İzin Yönetimi
          <Button
            variant="outline"
            size="sm"
            onClick={resetPermissions}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Sıfırla
          </Button>
        </CardTitle>
        <CardDescription>
          Uygulamanın cihaz özelliklerine erişim izinlerini yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notifications Permission */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Bildirimler</h4>
                {permissions.notifications ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="w-3 h-3" />
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <X className="w-3 h-3" />
                    Kapalı
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Önemli güncellemeler, mesajlar ve analizler için bildirim alın
              </p>
              {permissions.notifications ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeNotifications}
                >
                  İzni Kaldır
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={requestNotifications}
                >
                  İzin Ver
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Camera Permission */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Kamera</h4>
                {permissions.camera ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="w-3 h-3" />
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <X className="w-3 h-3" />
                    Kapalı
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                El yazısı, kahve fincanı ve el okuma fotoğrafları çekmek için
              </p>
              {!permissions.camera && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={requestCamera}
                >
                  İzin Ver
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Media Library Permission */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Galeri</h4>
                <Badge variant="outline">Otomatik</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Galeriden fotoğraf seçtiğinizde otomatik olarak izin istenecek
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Not:</strong> İzinleri tamamen iptal etmek için tarayıcınızın site ayarlarından izinleri yönetebilirsiniz. 
            "Sıfırla" butonuna basarsanız, uygulamayı tekrar açtığınızda izinler yeniden istenecektir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
