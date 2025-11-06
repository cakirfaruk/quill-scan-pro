import { useState } from "react";
import { useOfflineCache } from "@/hooks/use-offline-cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Trash2, HardDrive, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const OfflineCacheStatus = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const postsCache = useOfflineCache({ storeName: 'posts' });
  const messagesCache = useOfflineCache({ storeName: 'messages' });
  const conversationsCache = useOfflineCache({ storeName: 'conversations' });
  const profilesCache = useOfflineCache({ storeName: 'profiles' });

  const caches = [
    { name: 'Gönderiler', cache: postsCache, icon: '📝' },
    { name: 'Mesajlar', cache: messagesCache, icon: '💬' },
    { name: 'Konuşmalar', cache: conversationsCache, icon: '👥' },
    { name: 'Profiller', cache: profilesCache, icon: '👤' },
  ];

  const totalItems = caches.reduce((sum, c) => sum + c.cache.cacheSize, 0);

  const handleClearAll = async () => {
    for (const { cache } of caches) {
      await cache.clearCache();
    }
    toast({
      title: "Önbellek Temizlendi",
      description: "Tüm çevrimdışı veriler silindi",
    });
  };

  const formatSize = (size: number) => {
    if (size === 0) return '0';
    return size.toString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="w-4 h-4" />
          Önbellek
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalItems}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Çevrimdışı Önbellek Durumu
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3">
            {caches.map(({ name, cache, icon }) => (
              <Card key={name} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/50">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{icon}</span>
                      {name}
                    </span>
                    <Badge variant="outline">
                      {formatSize(cache.cacheSize)} öğe
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {cache.isLoadingCache ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Yükleniyor...
                        </span>
                      ) : cache.cacheSize === 0 ? (
                        'Boş'
                      ) : (
                        `Son güncelleme: Az önce`
                      )}
                    </div>
                    {cache.cacheSize > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cache.clearCache()}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Toplam Önbellek:</span>
              <Badge variant="secondary">{totalItems} öğe</Badge>
            </div>
            
            {totalItems > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tüm Önbelleği Temizle
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">ℹ️ Bilgi</p>
            <p>
              Çevrimdışı önbellek, internet bağlantısı olmadan içerikleri görüntülemenizi sağlar. 
              Veriler 7 gün sonra otomatik olarak temizlenir.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
