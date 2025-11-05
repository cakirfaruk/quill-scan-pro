import { useState } from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import { OfflineSyncDetailsDialog } from "./OfflineSyncDetailsDialog";

export const EnhancedOfflineIndicator = () => {
  const isOnline = useNetworkStatus();
  const { 
    pendingCount, 
    failedCount, 
    syncQueue, 
    isSyncing,
    syncProgress,
  } = useEnhancedOfflineSync();
  const [showDetails, setShowDetails] = useState(false);

  const totalIssues = pendingCount + failedCount;

  if (isOnline && totalIssues === 0 && !isSyncing) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in",
          "px-4 py-3 rounded-2xl shadow-elegant backdrop-blur-lg border-2",
          "max-w-sm w-full mx-4",
          isOnline 
            ? failedCount > 0
              ? "bg-orange-500/90 border-orange-400/50 text-white"
              : "bg-green-500/90 border-green-400/50 text-white"
            : "bg-destructive/90 border-destructive/50 text-destructive-foreground"
        )}
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isOnline ? 'Çevrimiçi' : 'Çevrimdışı Mod'}
              </span>
            </div>

            {totalIssues > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs hover:bg-white/20 text-white"
                onClick={() => setShowDetails(true)}
              >
                Detaylar
              </Button>
            )}
          </div>

          {/* Status Info */}
          {isSyncing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>Senkronize ediliyor...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-1.5 bg-white/20" />
            </div>
          )}

          {!isSyncing && totalIssues > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm flex-1">
                {failedCount > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{failedCount} başarısız</span>
                  </div>
                )}
                {failedCount > 0 && pendingCount > 0 && <span>•</span>}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{pendingCount} bekliyor</span>
                  </div>
                )}
              </div>

              {isOnline && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-3 text-xs hover:bg-white/20 text-white gap-1.5"
                  onClick={syncQueue}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gönder
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {!isSyncing && totalIssues === 0 && isOnline && (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tüm işlemler senkronize edildi</span>
            </div>
          )}
        </div>
      </div>

      <OfflineSyncDetailsDialog 
        open={showDetails} 
        onOpenChange={setShowDetails}
      />
    </>
  );
};
