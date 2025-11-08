import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Test channel to check connectivity
    const testChannel = supabase
      .channel('realtime-test')
      .on('system', {}, (payload) => {
        if (payload.status === 'ok') {
          setIsConnected(true);
          setLastUpdate(new Date());
        }
      })
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(testChannel);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className="gap-2"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 animate-pulse" />
            Canlı Bağlantı
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Bağlantı Yok
          </>
        )}
      </Badge>
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          Son: {lastUpdate.toLocaleTimeString('tr-TR')}
        </span>
      )}
    </div>
  );
}
