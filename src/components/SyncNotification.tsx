import { useState } from "react";
import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export const SyncNotification = () => {
  const isOnline = useNetworkStatus();
  const { 
    pendingCount, 
    failedCount, 
    isSyncing, 
    syncProgress,
    lastSyncTime,
    queue,
    syncQueue,
    retryFailed,
    clearQueue
  } = useEnhancedOfflineSync();

  const [showDetails, setShowDetails] = useState(false);

  const getErrorMessage = (error?: string) => {
    if (!error) return 'Bilinmeyen hata';
    
    // Parse common errors
    if (error.includes('Network')) return 'Bağlantı hatası';
    if (error.includes('timeout')) return 'Zaman aşımı';
    if (error.includes('401')) return 'Yetkilendirme hatası';
    if (error.includes('403')) return 'Erişim engellendi';
    if (error.includes('404')) return 'Kaynak bulunamadı';
    if (error.includes('500')) return 'Sunucu hatası';
    
    return error.length > 50 ? error.substring(0, 50) + '...' : error;
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'post': return 'Gönderi';
      case 'message': return 'Mesaj';
      case 'comment': return 'Yorum';
      case 'like': return 'Beğeni';
      case 'swipe': return 'Kaydırma';
      default: return 'İşlem';
    }
  };

  if (pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Persistent Status Indicator */}
      {(pendingCount > 0 || failedCount > 0 || isSyncing) && (
        <button
          onClick={() => setShowDetails(true)}
          className={cn(
            "fixed bottom-24 right-4 z-40 rounded-full shadow-elegant backdrop-blur-md",
            "px-4 py-2 flex items-center gap-2 transition-all hover:scale-105",
            "animate-fade-in",
            failedCount > 0 
              ? "bg-destructive/90 text-destructive-foreground" 
              : isSyncing
              ? "bg-blue-500/90 text-white"
              : "bg-amber-500/90 text-white"
          )}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Senkronize ediliyor...</span>
            </>
          ) : failedCount > 0 ? (
            <>
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{failedCount} başarısız</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{pendingCount} bekliyor</span>
            </>
          )}
        </button>
      )}

      {/* Detailed Status Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={cn(
                "w-5 h-5",
                isSyncing && "animate-spin"
              )} />
              Senkronizasyon Durumu
            </DialogTitle>
            <DialogDescription>
              Çevrimdışı yaptığınız değişikliklerin senkronizasyon durumu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Bekleyen</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center">
                <div className="text-2xl font-bold text-destructive">{failedCount}</div>
                <div className="text-xs text-muted-foreground">Başarısız</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {queue.filter(q => q.status === 'success').length}
                </div>
                <div className="text-xs text-muted-foreground">Başarılı</div>
              </div>
            </div>

            {/* Progress */}
            {isSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">İlerleme</span>
                  <span className="font-medium">{Math.round(syncProgress)}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            )}

            {/* Last Sync Time */}
            {lastSyncTime && (
              <div className="text-sm text-muted-foreground">
                Son senkronizasyon: {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: tr })}
              </div>
            )}

            {/* Queue Items */}
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {queue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tüm değişiklikler senkronize edildi</p>
                  </div>
                ) : (
                  queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getActionLabel(item.type)}
                          </Badge>
                          <Badge 
                            variant={
                              item.status === 'success' ? 'default' :
                              item.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {item.status === 'success' && 'Başarılı'}
                            {item.status === 'failed' && 'Başarısız'}
                            {item.status === 'pending' && 'Bekliyor'}
                            {item.status === 'syncing' && 'Gönderiliyor'}
                          </Badge>
                        </div>
                        
                        {item.error && (
                          <p className="text-sm text-destructive mb-2">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {getErrorMessage(item.error)}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: tr })}
                        </p>
                        
                        {item.retryCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.retryCount} kez denendi
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2">
              {failedCount > 0 && (
                <Button
                  onClick={() => {
                    retryFailed();
                    setShowDetails(false);
                  }}
                  className="flex-1"
                  disabled={!isOnline}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tekrar Dene ({failedCount})
                </Button>
              )}
              
              {(pendingCount > 0 || failedCount > 0) && isOnline && !isSyncing && (
                <Button
                  onClick={() => {
                    syncQueue();
                    setShowDetails(false);
                  }}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Şimdi Senkronize Et
                </Button>
              )}
              
              {queue.length > 0 && (
                <Button
                  onClick={() => {
                    if (confirm('Tüm bekleyen değişiklikler silinecek. Emin misiniz?')) {
                      clearQueue();
                      setShowDetails(false);
                    }
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  Tümünü Temizle
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
