import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const OfflineIndicator = () => {
  const isOnline = useNetworkStatus();
  const { queueCount, syncQueue, isSyncing } = useOfflineSync();

  if (isOnline && queueCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up",
        "px-4 py-2 rounded-full shadow-elegant backdrop-blur-md",
        isOnline 
          ? "bg-green-500/90 text-white" 
          : "bg-destructive/90 text-destructive-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Çevrimiçi</span>
            {queueCount > 0 && (
              <>
                <span className="text-xs opacity-75">
                  • {queueCount} bekleyen işlem
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 hover:bg-white/20"
                  onClick={syncQueue}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    "Gönder"
                  )}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Çevrimdışı Mod</span>
            {queueCount > 0 && (
              <span className="text-xs opacity-75">
                • {queueCount} kayıtlı işlem
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
