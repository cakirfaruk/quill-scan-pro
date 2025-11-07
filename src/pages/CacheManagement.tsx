import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCacheInfo } from "@/hooks/use-cache-info";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, HardDrive, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function CacheManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    cacheInfo,
    isLoading,
    refresh,
    clearHybridCache,
    clearOfflineStorage,
    clearServiceWorkerCache,
    clearAllCaches,
  } = useCacheInfo();

  const [clearing, setClearing] = useState<string | null>(null);

  const handleClearCache = async (
    type: "hybrid" | "offline" | "sw" | "all",
    cacheName?: string
  ) => {
    setClearing(type + (cacheName || ""));
    try {
      let success = false;
      switch (type) {
        case "hybrid":
          success = await clearHybridCache();
          break;
        case "offline":
          success = await clearOfflineStorage();
          break;
        case "sw":
          success = await clearServiceWorkerCache(cacheName);
          break;
        case "all":
          success = await clearAllCaches();
          break;
      }

      if (success) {
        toast({
          title: "Başarılı",
          description: "Cache başarıyla temizlendi",
        });
      } else {
        toast({
          title: "Hata",
          description: "Cache temizlenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    } finally {
      setClearing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cache Yönetimi</h1>
            <p className="text-sm text-muted-foreground">
              Uygulama cache'ini yönetin ve temizleyin
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Storage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Depolama Kullanımı
            </CardTitle>
            <CardDescription>
              Toplam kullanılan ve kalan depolama alanı
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheInfo && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kullanılan Alan</span>
                    <span className="font-mono">
                      {formatBytes(cacheInfo.storageQuota.usage)} / {formatBytes(cacheInfo.storageQuota.quota)}
                    </span>
                  </div>
                  <Progress value={cacheInfo.storageQuota.percentage} />
                  <p className="text-xs text-muted-foreground text-right">
                    %{cacheInfo.storageQuota.percentage.toFixed(1)} dolu
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hybrid Cache</p>
                    <p className="text-2xl font-bold">{formatBytes(cacheInfo.hybridCacheSize)}</p>
                    <p className="text-xs text-muted-foreground">{cacheInfo.hybridCacheCount} kayıt</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Offline Storage</p>
                    <p className="text-2xl font-bold">{formatBytes(cacheInfo.offlineStorageSize)}</p>
                    <p className="text-xs text-muted-foreground">{cacheInfo.offlineStorageCount} kayıt</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Hybrid Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Hybrid Cache (IndexedDB)
            </CardTitle>
            <CardDescription>
              API yanıtlarını hızlı erişim için önbelleğe alır
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheInfo && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{formatBytes(cacheInfo.hybridCacheSize)}</p>
                    <p className="text-xs text-muted-foreground">{cacheInfo.hybridCacheCount} API yanıtı</p>
                  </div>
                  <Badge variant="secondary">Aktif</Badge>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={clearing === "hybrid"}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {clearing === "hybrid" ? "Temizleniyor..." : "Hybrid Cache'i Temizle"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hybrid Cache'i temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem tüm API cache'lerini silecek. Bir sonraki yüklemede veriler tekrar sunucudan çekilecek.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClearCache("hybrid")}>
                        Temizle
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </CardContent>
        </Card>

        {/* Offline Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Offline Storage (IndexedDB)
            </CardTitle>
            <CardDescription>
              Çevrimdışı kullanım için veri depolar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheInfo && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{formatBytes(cacheInfo.offlineStorageSize)}</p>
                    <p className="text-xs text-muted-foreground">{cacheInfo.offlineStorageCount} offline kayıt</p>
                  </div>
                  <Badge variant="secondary">Aktif</Badge>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={clearing === "offline"}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {clearing === "offline" ? "Temizleniyor..." : "Offline Storage'ı Temizle"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Offline Storage'ı temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem tüm çevrimdışı verileri silecek. Senkronize edilmemiş değişiklikler kaybolabilir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClearCache("offline")}>
                        Temizle
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Worker Caches */}
        {cacheInfo && cacheInfo.serviceWorkerCaches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Service Worker Caches
              </CardTitle>
              <CardDescription>
                Resimler, scriptler ve diğer statik dosyalar için önbellek
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cacheInfo.serviceWorkerCaches.map((cache) => (
                <div key={cache.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]" title={cache.name}>
                        {cache.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(cache.size)} • {cache.count} dosya
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={clearing === "sw" + cache.name}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bu cache'i temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {cache.name} cache'i silinecek. Dosyalar bir sonraki ziyarette tekrar indirilecek.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleClearCache("sw", cache.name)}>
                            Temizle
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {cacheInfo.serviceWorkerCaches.indexOf(cache) < cacheInfo.serviceWorkerCaches.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={clearing === "sw"}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {clearing === "sw" ? "Temizleniyor..." : "Tüm SW Cache'leri Temizle"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tüm Service Worker cache'lerini temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem tüm Service Worker cache'lerini silecek. Resimler ve statik dosyalar tekrar indirilecek.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClearCache("sw")}>
                      Tümünü Temizle
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Toplu İşlemler</CardTitle>
            <CardDescription>
              Tüm cache'leri birden yönetin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={refresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Bilgileri Yenile
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={clearing === "all"}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearing === "all" ? "Temizleniyor..." : "Tüm Cache'leri Temizle"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tüm cache'leri temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Tüm cache'ler silinecek ve uygulama baştan başlatılacak.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearCache("all")}>
                    Tümünü Temizle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5" />
              Cache Hakkında
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Hybrid Cache:</strong> API yanıtlarını saklar. Feed, mesajlar ve profil bilgileri burada tutulur. Temizlemek güvenlidir.
            </p>
            <p>
              <strong>Offline Storage:</strong> Çevrimdışı çalışma için gerekli verileri tutar. Temizlemeden önce internet bağlantınızın olduğundan emin olun.
            </p>
            <p>
              <strong>Service Worker Caches:</strong> Resimler, scriptler ve statik dosyalar için. Temizlemek güvenlidir, dosyalar tekrar indirilecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
