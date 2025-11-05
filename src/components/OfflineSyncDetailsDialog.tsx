import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Trash2,
  X,
  MessageCircle,
  FileText,
  Heart,
  MessageSquare,
  UserPlus,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OfflineSyncDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_ICONS = {
  message: MessageCircle,
  post: FileText,
  like: Heart,
  comment: MessageSquare,
  friend_request: UserPlus,
  profile_update: User,
};

const ACTION_LABELS = {
  message: "Mesaj",
  post: "Gönderi",
  like: "Beğeni",
  comment: "Yorum",
  friend_request: "Arkadaşlık İsteği",
  profile_update: "Profil Güncelleme",
};

export const OfflineSyncDetailsDialog = ({
  open,
  onOpenChange,
}: OfflineSyncDetailsDialogProps) => {
  const {
    queue,
    stats,
    syncQueue,
    retryFailed,
    clearQueue,
    removeAction,
    isSyncing,
    lastSyncTime,
  } = useEnhancedOfflineSync();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Başarılı</Badge>;
      case 'failed':
        return <Badge variant="destructive">Başarısız</Badge>;
      case 'syncing':
        return <Badge variant="secondary">Gönderiliyor</Badge>;
      default:
        return <Badge variant="outline">Bekliyor</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Offline Senkronizasyon Durumu</DialogTitle>
          <DialogDescription>
            Çevrimdışıyken yapılan işlemler ve senkronizasyon durumu
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Toplam</div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Bekliyor</div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Başarısız</div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
            <div className="text-xs text-muted-foreground">Başarılı</div>
          </div>
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="text-xs text-muted-foreground text-center">
            Son senkronizasyon:{" "}
            {formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: tr })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={syncQueue}
            disabled={isSyncing || stats.pending === 0}
            className="flex-1 gap-2"
            variant="default"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Tümünü Gönder
          </Button>
          
          {stats.failed > 0 && (
            <Button
              onClick={retryFailed}
              disabled={isSyncing}
              className="flex-1 gap-2"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </Button>
          )}
          
          <Button
            onClick={clearQueue}
            disabled={isSyncing}
            variant="outline"
            size="icon"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Queue List */}
        <ScrollArea className="h-[300px] pr-4">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Bekleyen işlem yok</p>
              <p className="text-xs mt-1">
                Çevrimdışıyken yaptığınız işlemler burada görünecek
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((action) => {
                const Icon = ACTION_ICONS[action.type as keyof typeof ACTION_ICONS];
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "p-3 rounded-lg border bg-card transition-all",
                      action.status === 'syncing' && "border-primary bg-primary/5",
                      action.status === 'failed' && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(action.status)}
                            <span className="font-medium text-sm">
                              {ACTION_LABELS[action.type as keyof typeof ACTION_LABELS]}
                            </span>
                          </div>
                          {getStatusBadge(action.status)}
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {formatDistanceToNow(action.timestamp, {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>

                        {action.retryCount > 0 && (
                          <p className="text-xs text-orange-500">
                            {action.retryCount} kez denendi
                          </p>
                        )}

                        {action.error && (
                          <p className="text-xs text-destructive mt-1">
                            {action.error}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeAction(action.id)}
                        disabled={action.status === 'syncing'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
