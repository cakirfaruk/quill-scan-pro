import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Mail, Users, Heart, MessageCircle, Sparkles, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NotificationPrefs {
  enable_friend_requests: boolean;
  enable_friend_accepted: boolean;
  enable_new_messages: boolean;
  enable_mentions: boolean;
  enable_post_likes: boolean;
  enable_post_comments: boolean;
  enable_group_invites: boolean;
  enable_group_messages: boolean;
  enable_match_notifications: boolean;
  enable_analysis_results: boolean;
  enable_push_notifications: boolean;
  enable_email_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    enable_friend_requests: true,
    enable_friend_accepted: true,
    enable_new_messages: true,
    enable_mentions: true,
    enable_post_likes: true,
    enable_post_comments: true,
    enable_group_invites: true,
    enable_group_messages: true,
    enable_match_notifications: true,
    enable_analysis_results: true,
    enable_push_notifications: true,
    enable_email_notifications: false,
    quiet_hours_enabled: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === "PGRST116") {
          await supabase
            .from("notification_preferences")
            .insert({ user_id: user.id });
        } else {
          throw error;
        }
      } else if (data) {
        setPreferences({
          enable_friend_requests: data.enable_friend_requests,
          enable_friend_accepted: data.enable_friend_accepted,
          enable_new_messages: data.enable_new_messages,
          enable_mentions: data.enable_mentions,
          enable_post_likes: data.enable_post_likes,
          enable_post_comments: data.enable_post_comments,
          enable_group_invites: data.enable_group_invites,
          enable_group_messages: data.enable_group_messages,
          enable_match_notifications: data.enable_match_notifications,
          enable_analysis_results: data.enable_analysis_results,
          enable_push_notifications: data.enable_push_notifications,
          enable_email_notifications: data.enable_email_notifications,
          quiet_hours_enabled: data.quiet_hours_enabled,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean | string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, [key]: value }));

      toast({
        title: "Kaydedildi",
        description: "Bildirim tercihiniz güncellendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tercih güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Bildirim Kanalları
          </CardTitle>
          <CardDescription>
            Bildirimleri nasıl almak istediğinizi seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Push Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Uygulama bildirimleri alın
              </p>
            </div>
            <Switch
              id="push"
              checked={preferences.enable_push_notifications}
              onCheckedChange={(checked) =>
                updatePreference("enable_push_notifications", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label htmlFor="email">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">
                  Önemli güncellemeler için e-posta alın
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.enable_email_notifications}
              onCheckedChange={(checked) =>
                updatePreference("enable_email_notifications", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sosyal Bildirimler
          </CardTitle>
          <CardDescription>
            Arkadaşlıklar ve etkileşimler hakkında bildirimler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="friend-requests">Arkadaşlık İstekleri</Label>
            <Switch
              id="friend-requests"
              checked={preferences.enable_friend_requests}
              onCheckedChange={(checked) =>
                updatePreference("enable_friend_requests", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="friend-accepted">Kabul Edilen Arkadaşlıklar</Label>
            <Switch
              id="friend-accepted"
              checked={preferences.enable_friend_accepted}
              onCheckedChange={(checked) =>
                updatePreference("enable_friend_accepted", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="mentions">Etiketlenmeler</Label>
            <Switch
              id="mentions"
              checked={preferences.enable_mentions}
              onCheckedChange={(checked) =>
                updatePreference("enable_mentions", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Interactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            İçerik Etkileşimleri
          </CardTitle>
          <CardDescription>
            Gönderilerinizle ilgili bildirimler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="post-likes">Beğeniler</Label>
            <Switch
              id="post-likes"
              checked={preferences.enable_post_likes}
              onCheckedChange={(checked) =>
                updatePreference("enable_post_likes", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="post-comments">Yorumlar</Label>
            <Switch
              id="post-comments"
              checked={preferences.enable_post_comments}
              onCheckedChange={(checked) =>
                updatePreference("enable_post_comments", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages & Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Mesajlar & Gruplar
          </CardTitle>
          <CardDescription>
            Mesajlaşma ve grup aktiviteleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="messages">Yeni Mesajlar</Label>
            <Switch
              id="messages"
              checked={preferences.enable_new_messages}
              onCheckedChange={(checked) =>
                updatePreference("enable_new_messages", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="group-invites">Grup Davetleri</Label>
            <Switch
              id="group-invites"
              checked={preferences.enable_group_invites}
              onCheckedChange={(checked) =>
                updatePreference("enable_group_invites", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="group-messages">Grup Mesajları</Label>
            <Switch
              id="group-messages"
              checked={preferences.enable_group_messages}
              onCheckedChange={(checked) =>
                updatePreference("enable_group_messages", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Özellikler
          </CardTitle>
          <CardDescription>
            Eşleşme ve analiz bildirimleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="matches">Eşleşme Bildirimleri</Label>
            <Switch
              id="matches"
              checked={preferences.enable_match_notifications}
              onCheckedChange={(checked) =>
                updatePreference("enable_match_notifications", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="analysis">Analiz Sonuçları</Label>
            <Switch
              id="analysis"
              checked={preferences.enable_analysis_results}
              onCheckedChange={(checked) =>
                updatePreference("enable_analysis_results", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Sessiz Saatler
          </CardTitle>
          <CardDescription>
            Belirli saatlerde bildirimleri kapat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Sessiz Saatleri Etkinleştir</Label>
            <Switch
              id="quiet-hours"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) =>
                updatePreference("quiet_hours_enabled", checked)
              }
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Başlangıç</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={preferences.quiet_hours_start || "22:00"}
                    onChange={(e) =>
                      updatePreference("quiet_hours_start", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">Bitiş</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={preferences.quiet_hours_end || "08:00"}
                    onChange={(e) =>
                      updatePreference("quiet_hours_end", e.target.value)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
