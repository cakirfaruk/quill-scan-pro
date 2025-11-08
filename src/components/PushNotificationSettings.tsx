import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check, AlertCircle, Smartphone, MessageCircle, Users, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  requestNotificationPermission, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  checkNotificationPermission 
} from "@/utils/pushNotifications";
import { supabase } from "@/integrations/supabase/client";

export const PushNotificationSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState({
    messages: true,
    likes: true,
    comments: true,
    friendRequests: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    loadPreferences();
  }, []);

  const checkStatus = async () => {
    const status = checkNotificationPermission();
    setPermissionStatus(status);
    setIsEnabled(status === 'granted');

    // Check if user has an active subscription
    if ('serviceWorker' in navigator && status === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setIsEnabled(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          messages: data.enable_new_messages ?? true,
          likes: data.enable_post_likes ?? true,
          comments: data.enable_post_comments ?? true,
          friendRequests: data.enable_friend_requests ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: typeof preferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          enable_new_messages: newPreferences.messages,
          enable_post_likes: newPreferences.likes,
          enable_post_comments: newPreferences.comments,
          enable_friend_requests: newPreferences.friendRequests,
        });

      if (error) throw error;

      toast({
        title: "Kaydedildi",
        description: "Bildirim tercihleri güncellendi",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Hata",
        description: "Tercihler kaydedilemedi",
        variant: "destructive"
      });
    }
  };

  const handleToggleNotifications = async () => {
    if (isEnabled) {
      // Disable notifications
      setIsLoading(true);
      try {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsEnabled(false);
          toast({
            title: "Bildirimler Kapatıldı",
            description: "Push bildirimleri devre dışı bırakıldı",
          });
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "Bildirimler kapatılamadı",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enable notifications
      setIsLoading(true);
      try {
        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          toast({
            title: "İzin Reddedildi",
            description: "Bildirimler için tarayıcı ayarlarından izin vermelisiniz",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Subscribe to push notifications
        const success = await subscribeToPushNotifications();
        if (success) {
          setIsEnabled(true);
          setPermissionStatus('granted');
          toast({
            title: "✅ Bildirimler Aktif",
            description: "Artık push bildirimleri alacaksınız",
          });

          // Send test notification
          new Notification("Hoş Geldin! 🎉", {
            body: "Bildirimler başarıyla aktif edildi",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
          });
        } else {
          throw new Error("Subscription failed");
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        toast({
          title: "Hata",
          description: "Bildirimler etkinleştirilemedi",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Bildirimleri
        </CardTitle>
        <CardDescription>
          Anlık bildirimler alın - uygulama kapalıyken bile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Push Bildirimleri
            </Label>
            <p className="text-sm text-muted-foreground">
              {permissionStatus === 'denied' 
                ? 'Tarayıcı ayarlarından izin verin' 
                : isEnabled 
                ? 'Bildirimler aktif' 
                : 'Bildirimleri etkinleştir'}
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || permissionStatus === 'denied'}
          />
        </div>

        {/* Permission Status Warning */}
        {permissionStatus === 'denied' && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-destructive">Bildirim İzni Reddedildi</p>
              <p className="text-xs text-muted-foreground">
                Tarayıcı ayarlarından bu siteye bildirim gönderme izni vermelisiniz
              </p>
            </div>
          </div>
        )}

        {/* Success Status */}
        {isEnabled && permissionStatus === 'granted' && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Bildirimler Aktif
              </p>
              <p className="text-xs text-muted-foreground">
                Önemli olaylardan haberdar olacaksınız
              </p>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        {isEnabled && (
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium">Bildirim Tercihleri</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pref-messages" className="text-sm">Yeni Mesajlar</Label>
                    <p className="text-xs text-muted-foreground">Mesaj aldığında bildirim al</p>
                  </div>
                </div>
                <Switch
                  id="pref-messages"
                  checked={preferences.messages}
                  onCheckedChange={(checked) => handlePreferenceChange('messages', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pref-likes" className="text-sm">Beğeniler</Label>
                    <p className="text-xs text-muted-foreground">Gönderilerine beğeni geldiğinde</p>
                  </div>
                </div>
                <Switch
                  id="pref-likes"
                  checked={preferences.likes}
                  onCheckedChange={(checked) => handlePreferenceChange('likes', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pref-comments" className="text-sm">Yorumlar</Label>
                    <p className="text-xs text-muted-foreground">Gönderilerine yorum geldiğinde</p>
                  </div>
                </div>
                <Switch
                  id="pref-comments"
                  checked={preferences.comments}
                  onCheckedChange={(checked) => handlePreferenceChange('comments', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pref-friends" className="text-sm">Arkadaşlık İstekleri</Label>
                    <p className="text-xs text-muted-foreground">Arkadaşlık isteği aldığında</p>
                  </div>
                </div>
                <Switch
                  id="pref-friends"
                  checked={preferences.friendRequests}
                  onCheckedChange={(checked) => handlePreferenceChange('friendRequests', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* PWA Install Prompt */}
        {!window.matchMedia('(display-mode: standalone)').matches && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Smartphone className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium">Daha İyi Deneyim</p>
              <p className="text-xs text-muted-foreground">
                Uygulamayı ana ekranına ekle - daha hızlı ve offline çalışır
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
