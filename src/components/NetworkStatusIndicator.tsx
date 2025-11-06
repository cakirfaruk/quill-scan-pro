import { useNetworkInfo } from "@/hooks/use-network-info";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Network status indicator showing connection speed
 * Optional component - can be added to header for debugging
 */
export const NetworkStatusIndicator = () => {
  const { effectiveType, downlink, saveData, isSlowConnection } = useNetworkInfo();

  const getIcon = () => {
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return <SignalLow className="w-3 h-3" />;
    }
    if (effectiveType === '3g') {
      return <SignalMedium className="w-3 h-3" />;
    }
    return <SignalHigh className="w-3 h-3" />;
  };

  const getVariant = () => {
    if (isSlowConnection) return 'destructive';
    if (effectiveType === '3g') return 'outline';
    return 'secondary';
  };

  const getLabel = () => {
    if (saveData) return '💾 Tasarruf';
    return effectiveType.toUpperCase();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className="gap-1 text-[10px] px-2 py-0.5">
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Bağlantı:</strong> {effectiveType}</p>
            <p><strong>Hız:</strong> {downlink} Mbps</p>
            {saveData && <p className="text-warning">💾 Veri tasarrufu aktif</p>}
            {isSlowConnection && (
              <p className="text-destructive">⏸️ Preload devre dışı</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
