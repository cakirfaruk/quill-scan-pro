import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Database, HardDrive, Clock, Trash2 } from "lucide-react";
import { offlineStorage } from "@/utils/offlineStorage";

interface CacheSettingsType {
  maxSize: number; // MB
  cleanupInterval: number; // hours
  autoCleanup: boolean;
  maxAge: number; // days
}

const DEFAULT_SETTINGS: CacheSettingsType = {
  maxSize: 50, // 50 MB
  cleanupInterval: 24, // 24 hours
  autoCleanup: true,
  maxAge: 7, // 7 days
};

export const CacheSettings = () => {
  const [settings, setSettings] = useState<CacheSettingsType>(DEFAULT_SETTINGS);
  const [currentSize, setCurrentSize] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    calculateCurrentSize();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('cache-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: CacheSettingsType) => {
    setSettings(newSettings);
    localStorage.setItem('cache-settings', JSON.stringify(newSettings));
    toast({
      title: "Ayarlar Kaydedildi",
      description: "Önbellek ayarlarınız güncellendi.",
    });
  };

  const calculateCurrentSize = async () => {
    try {
      const size = await offlineStorage.estimateSize();
      setCurrentSize(size);
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
  };

  const handleCleanup = async () => {
    try {
      await offlineStorage.cleanup();
      await calculateCurrentSize();
      toast({
        title: "Temizlik Tamamlandı",
        description: "Eski veriler temizlendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Temizlik sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Önbellek Ayarları
        </CardTitle>
        <CardDescription>
          Çevrimdışı veri depolama limitlerinizi yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Size */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Kullanılan Alan</span>
          </div>
          <span className="text-sm font-bold">{formatSize(currentSize)}</span>
        </div>

        {/* Max Size Limit */}
        <div className="space-y-2">
          <Label htmlFor="maxSize">Maksimum Önbellek Boyutu</Label>
          <Select
            value={settings.maxSize.toString()}
            onValueChange={(value) => saveSettings({ ...settings, maxSize: parseInt(value) })}
          >
            <SelectTrigger id="maxSize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 MB</SelectItem>
              <SelectItem value="50">50 MB</SelectItem>
              <SelectItem value="100">100 MB</SelectItem>
              <SelectItem value="250">250 MB</SelectItem>
              <SelectItem value="500">500 MB</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Önbelleğin maksimum boyutu. Bu limite ulaşıldığında en eski veriler silinir.
          </p>
        </div>

        {/* Max Age */}
        <div className="space-y-2">
          <Label htmlFor="maxAge">Veri Saklama Süresi</Label>
          <Select
            value={settings.maxAge.toString()}
            onValueChange={(value) => saveSettings({ ...settings, maxAge: parseInt(value) })}
          >
            <SelectTrigger id="maxAge">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Gün</SelectItem>
              <SelectItem value="3">3 Gün</SelectItem>
              <SelectItem value="7">7 Gün</SelectItem>
              <SelectItem value="14">14 Gün</SelectItem>
              <SelectItem value="30">30 Gün</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Bu süreden eski veriler otomatik olarak silinir.
          </p>
        </div>

        {/* Auto Cleanup */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="autoCleanup">Otomatik Temizlik</Label>
            <p className="text-xs text-muted-foreground">
              Eski verileri otomatik olarak temizle
            </p>
          </div>
          <Switch
            id="autoCleanup"
            checked={settings.autoCleanup}
            onCheckedChange={(checked) => saveSettings({ ...settings, autoCleanup: checked })}
          />
        </div>

        {/* Cleanup Interval */}
        {settings.autoCleanup && (
          <div className="space-y-2">
            <Label htmlFor="cleanupInterval" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Temizlik Sıklığı
            </Label>
            <Select
              value={settings.cleanupInterval.toString()}
              onValueChange={(value) => saveSettings({ ...settings, cleanupInterval: parseInt(value) })}
            >
              <SelectTrigger id="cleanupInterval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Her Saat</SelectItem>
                <SelectItem value="6">Her 6 Saat</SelectItem>
                <SelectItem value="12">Her 12 Saat</SelectItem>
                <SelectItem value="24">Her Gün</SelectItem>
                <SelectItem value="168">Her Hafta</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Otomatik temizlik işleminin ne sıklıkla çalışacağı.
            </p>
          </div>
        )}

        {/* Manual Cleanup */}
        <Button
          onClick={handleCleanup}
          variant="outline"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Manuel Temizlik Yap
        </Button>

        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Not:</strong> Önbellek ayarları yalnızca çevrimdışı veriler için geçerlidir. 
            Çevrimiçi olduğunuzda veriler her zaman sunucudan yüklenir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
