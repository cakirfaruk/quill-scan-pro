import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

interface SyncProgressBarProps {
  className?: string;
  showLabel?: boolean;
}

export const SyncProgressBar = ({ className, showLabel = true }: SyncProgressBarProps) => {
  const { 
    isSyncing, 
    syncProgress, 
    pendingCount, 
    failedCount 
  } = useEnhancedOfflineSync();

  if (!isSyncing && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-muted-foreground">Senkronize ediliyor...</span>
              </>
            ) : failedCount > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-destructive">{failedCount} başarısız</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Hazır</span>
              </>
            )}
          </div>
          {isSyncing && (
            <span className="font-medium">{Math.round(syncProgress)}%</span>
          )}
        </div>
      )}
      
      {isSyncing && (
        <Progress 
          value={syncProgress} 
          className={cn(
            "h-2 transition-all",
            failedCount > 0 && "bg-destructive/20"
          )}
        />
      )}
    </div>
  );
};
