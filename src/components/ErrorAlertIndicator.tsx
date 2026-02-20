import { useEffect, useState } from 'react';
import { useErrorAlerts } from '@/hooks/use-error-alerts';
import { Bell, BellOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Error Alert Indicator Component
 * Shows alert status in the header/toolbar
 */
export const ErrorAlertIndicator = () => {
  const { preferences, isLoading, updatePreferences } = useErrorAlerts();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  if (!preferences) return null;

  const isActive = preferences.error_alerts_enabled;
  const isPushEnabled = preferences.push_enabled && hasPermission;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isActive ? (
            <Bell className={`h-5 w-5 ${isPushEnabled ? 'text-green-500' : ''}`} />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {isActive && (
            <span className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Hata Bildirimleri</span>
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
            {isActive ? 'Aktif' : 'Kapalı'}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Seviye:</span>
              <Badge variant="outline" className="text-xs capitalize">
                {preferences.alert_severity_threshold}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Push:</span>
              <Badge variant={isPushEnabled ? 'default' : 'secondary'} className="text-xs">
                {isPushEnabled ? 'Açık' : 'Kapalı'}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => updatePreferences({ error_alerts_enabled: !isActive })}
        >
          {isActive ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Bildirimleri Kapat
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Bildirimleri Aç
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
