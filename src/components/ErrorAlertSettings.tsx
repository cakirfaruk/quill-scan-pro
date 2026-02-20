import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useErrorAlerts } from '@/hooks/use-error-alerts';
import { Bell, BellOff, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ErrorAlertSettings = () => {
  const { preferences, isLoading, updatePreferences, requestPushPermission } = useErrorAlerts();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-5 w-5" />
          <p>Bildirim tercihleri yüklenemedi.</p>
        </div>
      </Card>
    );
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission first
      const granted = await requestPushPermission();
      if (!granted) return;
    } else {
      await updatePreferences({ push_enabled: false });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Hata Bildirimleri</h3>
          <p className="text-sm text-muted-foreground">
            Real-time hata alertleri ve bildirim ayarları
          </p>
        </div>
      </div>

      {/* Alert Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          {preferences.error_alerts_enabled ? (
            <Bell className="h-5 w-5 text-green-500" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {preferences.error_alerts_enabled ? 'Bildirimler Aktif' : 'Bildirimler Kapalı'}
            </p>
            <p className="text-sm text-muted-foreground">
              Yeni hatalar gerçek zamanlı olarak bildirilir
            </p>
          </div>
        </div>
        <Badge variant={preferences.error_alerts_enabled ? 'default' : 'secondary'}>
          {preferences.error_alerts_enabled ? 'Açık' : 'Kapalı'}
        </Badge>
      </div>

      {/* Enable/Disable Alerts */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="alerts-enabled" className="text-base">
            Hata Uyarılarını Etkinleştir
          </Label>
          <p className="text-sm text-muted-foreground">
            Yeni hatalar oluştuğunda bildirim göster
          </p>
        </div>
        <Switch
          id="alerts-enabled"
          checked={preferences.error_alerts_enabled}
          onCheckedChange={(checked) => updatePreferences({ error_alerts_enabled: checked })}
        />
      </div>

      {/* Severity Threshold */}
      <div className="space-y-2">
        <Label htmlFor="severity-threshold">Minimum Hata Seviyesi</Label>
        <Select
          value={preferences.alert_severity_threshold}
          onValueChange={(value) =>
            updatePreferences({ alert_severity_threshold: value as any })
          }
          disabled={!preferences.error_alerts_enabled}
        >
          <SelectTrigger id="severity-threshold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Info - Tüm bildirimler</span>
              </div>
            </SelectItem>
            <SelectItem value="warning">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span>Warning - Uyarılar ve üstü</span>
              </div>
            </SelectItem>
            <SelectItem value="error">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Error - Sadece hatalar</span>
              </div>
            </SelectItem>
            <SelectItem value="fatal">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Fatal - Sadece kritik hatalar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Seçilen seviye ve üstü için bildirim alırsınız
        </p>
      </div>

      {/* Browser Push Notifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-enabled" className="text-base">
              Push Bildirimleri
            </Label>
            <p className="text-sm text-muted-foreground">
              Tarayıcı bildirimleri (sekme kapalıyken bile çalışır)
            </p>
          </div>
          <Switch
            id="push-enabled"
            checked={preferences.push_enabled}
            onCheckedChange={handlePushToggle}
            disabled={!preferences.error_alerts_enabled}
          />
        </div>

        {preferences.push_enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <AlertCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="text-sm text-green-700 dark:text-green-400">
              <p className="font-medium">Push bildirimleri aktif</p>
              <p className="text-xs opacity-90">
                Tarayıcınız kapalıyken bile kritik hatalar için bildirim alacaksınız
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Bildirim Nasıl Çalışır?</p>
          <ul className="text-xs space-y-1 opacity-90">
            <li>• Yeni hatalar gerçek zamanlı olarak izlenir</li>
            <li>• Seçtiğiniz seviye ve üstü için bildirim gösterilir</li>
            <li>• Fatal hatalar otomatik kapatılmaz (manuel kapatmalısınız)</li>
            <li>• Push bildirimleri sekme kapalıyken de çalışır</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
