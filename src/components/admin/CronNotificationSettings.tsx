import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail, Smartphone, Plus, X, Send } from "lucide-react";

interface NotificationSettings {
  id?: string;
  email_on_error: boolean;
  email_on_success: boolean;
  push_on_error: boolean;
  push_on_success: boolean;
  email_recipients: string[];
}

export function CronNotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [settings, setSettings] = useState<NotificationSettings>({
    email_on_error: true,
    email_on_success: false,
    push_on_error: true,
    push_on_success: false,
    email_recipients: [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_notification_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          email_on_error: data.email_on_error,
          email_on_success: data.email_on_success,
          push_on_error: data.push_on_error,
          push_on_success: data.push_on_success,
          email_recipients: data.email_recipients || [],
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const payload = {
        email_on_error: settings.email_on_error,
        email_on_success: settings.email_on_success,
        push_on_error: settings.push_on_error,
        push_on_success: settings.push_on_success,
        email_recipients: settings.email_recipients,
      };

      const { error } = await supabase
        .from('cron_notification_settings')
        .upsert(settings.id ? { id: settings.id, ...payload } : payload);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Bildirim ayarları kaydedildi",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setSettings({
        ...settings,
        email_recipients: [...settings.email_recipients, newEmail],
      });
      setNewEmail("");
    } else {
      toast({
        title: "Hata",
        description: "Geçerli bir e-posta adresi giriniz",
        variant: "destructive",
      });
    }
  };

  const removeEmail = (email: string) => {
    setSettings({
      ...settings,
      email_recipients: settings.email_recipients.filter(e => e !== email),
    });
  };

  const handleTestNotification = async (testType: 'success' | 'error') => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-cron-notification', {
        body: {
          jobName: 'test-notification-job',
          status: testType === 'error' ? 'failed' : 'success',
          errorMessage: testType === 'error' ? 'Bu bir test hatasıdır. Sistem düzgün çalışıyor.' : undefined,
          duration: 1234,
          isTest: true,
        }
      });
      
      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Test bildirimi (${testType === 'error' ? 'Hata' : 'Başarı'}) gönderildi!`,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Hata",
        description: 'Test bildirimi gönderilemedi',
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>E-posta Bildirimleri</CardTitle>
          </div>
          <CardDescription>
            Cron job durumları için e-posta bildirimleri ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-error">Hata Durumunda Bildirim</Label>
              <p className="text-sm text-muted-foreground">
                Cron job başarısız olduğunda e-posta gönder
              </p>
            </div>
            <Switch
              id="email-error"
              checked={settings.email_on_error}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_on_error: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-success">Başarı Durumunda Bildirim</Label>
              <p className="text-sm text-muted-foreground">
                Cron job başarıyla tamamlandığında e-posta gönder
              </p>
            </div>
            <Switch
              id="email-success"
              checked={settings.email_on_success}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_on_success: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>E-posta Alıcıları</Label>
            <div className="flex gap-2">
              <Input
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmail()}
              />
              <Button onClick={addEmail} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.email_recipients.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>Push Bildirimleri</CardTitle>
          </div>
          <CardDescription>
            Admin kullanıcılarına tarayıcı bildirimleri gönder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-error">Hata Durumunda Bildirim</Label>
              <p className="text-sm text-muted-foreground">
                Cron job başarısız olduğunda push bildirimi gönder
              </p>
            </div>
            <Switch
              id="push-error"
              checked={settings.push_on_error}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, push_on_error: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-success">Başarı Durumunda Bildirim</Label>
              <p className="text-sm text-muted-foreground">
                Cron job başarıyla tamamlandığında push bildirimi gönder
              </p>
            </div>
            <Switch
              id="push-success"
              checked={settings.push_on_success}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, push_on_success: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={loading} className="w-full">
        {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Bildirimleri Test Et
          </CardTitle>
          <CardDescription>
            Bildirim sisteminin çalıştığını doğrulamak için test bildirimleri gönderin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Test bildirimleri, yukarıda yapılandırdığınız tüm aktif kanallara gönderilecektir.
                Bu, e-posta ve push bildirim ayarlarınızın doğru çalıştığından emin olmanızı sağlar.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                onClick={() => handleTestNotification('success')}
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                <Badge variant="default" className="mr-2">Başarı</Badge>
                Test Başarı Bildirimi
              </Button>

              <Button
                onClick={() => handleTestNotification('error')}
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                <Badge variant="destructive" className="mr-2">Hata</Badge>
                Test Hata Bildirimi
              </Button>
            </div>

            {isTesting && (
              <div className="text-center text-sm text-muted-foreground">
                Test bildirimi gönderiliyor...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
