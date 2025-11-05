import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, MapPin, Clock, User, Lock, Mail, Moon, Sun, Bell, Heart, UserX, LogOut, Phone, RotateCcw, Shield, Eye, Palette, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requestNotificationPermission } from "@/utils/notifications";
import { subscribeToPushNotifications } from "@/utils/pushNotifications";
import { PlaceAutocompleteInput } from "@/components/PlaceAutocompleteInput";
import { AutoResponseSettings } from "@/components/AutoResponseSettings";
import { resetOnboarding } from "@/components/OnboardingTour";
import { ThemeCustomizationPanel } from "@/components/ThemeCustomizationPanel";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PermissionSettings } from "@/components/PermissionSettings";

const Settings = () => {
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
    current_location: "",
    bio: "",
    gender: "",
    email: "",
    show_in_matches: true,
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadBlockedUsers();
    
    // Check for dark mode preference
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    
    // Check notification permission status
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
        throw error;
      }

      if (!data) {
        // Profile doesn't exist, create one
        console.log("Profile not found, creating new profile");
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || 'user',
            credits: 10,
          });

        if (insertError) {
          console.error("Profile creation error:", insertError);
          throw insertError;
        }

        // Load the newly created profile
        const { data: newData, error: newError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (newError || !newData) {
          throw new Error("Profil oluşturulamadı");
        }

        setProfile({
          username: newData.username || "",
          full_name: newData.full_name || "",
          birth_date: newData.birth_date || "",
          birth_time: newData.birth_time || "",
          birth_place: newData.birth_place || "",
          current_location: newData.current_location || "",
          bio: newData.bio || "",
          gender: newData.gender || "",
          email: user.email || "",
          show_in_matches: newData.show_in_matches ?? true,
        });
      } else {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          birth_date: data.birth_date || "",
          birth_time: data.birth_time || "",
          birth_place: data.birth_place || "",
          current_location: data.current_location || "",
          bio: data.bio || "",
          gender: data.gender || "",
          email: user.email || "",
          show_in_matches: data.show_in_matches ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Ayarlar yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          birth_date: profile.birth_date || null,
          birth_time: profile.birth_time || null,
          birth_place: profile.birth_place || null,
          current_location: profile.current_location || null,
          bio: profile.bio || null,
          gender: profile.gender || null,
          show_in_matches: profile.show_in_matches,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      toast({
        title: "Başarılı",
        description: "Bilgileriniz güncellendi.",
      });
    } catch (error: any) {
      console.error("Profile save error:", error);
      toast({
        title: "Hata",
        description: error.message || "Bilgiler güncellenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Hata",
        description: "Yeni şifreler eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Şifreniz değiştirildi.",
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Şifre değiştirilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "E-posta adresiniz güncellendi. Lütfen e-postanızı onaylayın.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "E-posta değiştirilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        // Subscribe to push notifications
        const subscribed = await subscribeToPushNotifications();
        if (subscribed) {
          setNotificationsEnabled(true);
          toast({
            title: "Bildirimler Aktif",
            description: "Artık önemli güncellemelerden haberdar olacaksınız.",
          });
        }
      } else {
        // Show instructions for different browsers
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        let instructions = "Tarayıcı ayarlarından bildirimlere izin verin:\n\n";
        if (isChrome) {
          instructions += "Chrome: Adres çubuğundaki 🔒 simgesine tıklayın → Bildirimler → İzin Ver";
        } else if (isSafari) {
          instructions += "Safari: Safari → Tercihler → Web Siteleri → Bildirimler";
        } else {
          instructions += "Adres çubuğundaki site ayarları simgesine tıklayın ve bildirimlere izin verin.";
        }
        
        toast({
          title: "Bildirim İzni Gerekli",
          description: instructions,
          variant: "destructive",
          duration: 8000,
        });
      }
    } else {
      toast({
        title: "Bildirimler Aktif",
        description: "Bildirimleri kapatmak için tarayıcı ayarlarından izni kaldırabilirsiniz.",
      });
    }
  };

  const handleTestPushNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Hata",
          description: "Oturum açmanız gerekiyor.",
          variant: "destructive",
        });
        return;
      }

      // Check if notifications are enabled
      if (!notificationsEnabled || Notification.permission !== 'granted') {
        toast({
          title: "Bildirimler Kapalı",
          description: "Önce bildirimleri aktif etmeniz gerekiyor.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Test Bildirimi Gönderiliyor",
        description: "Birkaç saniye içinde bir test bildirimi alacaksınız...",
      });

      // Send test notification
      const { error } = await supabase.functions.invoke('test-push-notification', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Test Başarılı",
        description: "Test bildirimi gönderildi!",
      });
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({
        title: "Hata",
        description: "Test bildirimi gönderilemedi: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ 
      title: "Çıkış yapıldı", 
      description: "Başarıyla çıkış yaptınız." 
    });
    navigate("/auth");
  };

  const loadBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get blocked user IDs
      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_users")
        .select("id, blocked_user_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (blockedError) throw blockedError;

      if (!blockedData || blockedData.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Get profiles for blocked users
      const blockedUserIds = blockedData.map(b => b.blocked_user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", blockedUserIds);

      if (profilesError) throw profilesError;

      // Combine blocked data with profile data
      const enrichedBlockedUsers = blockedData.map(blocked => ({
        ...blocked,
        profiles: profilesData?.find(p => p.user_id === blocked.blocked_user_id)
      }));

      setBlockedUsers(enrichedBlockedUsers || []);
    } catch (error: any) {
      console.error("Error loading blocked users:", error);
      toast({
        title: "Hata",
        description: "Engellenen kullanıcılar yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblockUser = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Kullanıcının engeli kaldırıldı.",
      });

      await loadBlockedUsers();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Engel kaldırılamadı.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Ayarlar
        </h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-7 gap-1">
            <TabsTrigger value="profile" className="flex flex-col gap-1 h-auto py-2">
              <User className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex flex-col gap-1 h-auto py-2">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Hesap</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col gap-1 h-auto py-2">
              <Bell className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Bildirim</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex flex-col gap-1 h-auto py-2">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">İzinler</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col gap-1 h-auto py-2">
              <Lock className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Güvenlik</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex flex-col gap-1 h-auto py-2">
              <UserX className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Engelli</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex flex-col gap-1 h-auto py-2">
              <Palette className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Görünüm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription>
                  Profilinizde görünen kişisel bilgilerinizi düzenleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    disabled
                    className="mt-2 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Kullanıcı adınız değiştirilemez
                  </p>
                </div>

                <div>
                  <Label htmlFor="full_name">Tam Ad</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Cinsiyet</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="birth_date">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Doğum Tarihi
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profile.birth_date}
                    onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_time">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Doğum Saati
                  </Label>
                  <Input
                    id="birth_time"
                    type="time"
                    value={profile.birth_time}
                    onChange={(e) => setProfile({ ...profile, birth_time: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_place">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Doğum Yeri
                  </Label>
                  <div className="mt-2">
                    <PlaceAutocompleteInput
                      id="birth_place"
                      value={profile.birth_place}
                      onChange={(value) => setProfile({ ...profile, birth_place: value })}
                      placeholder="Şehir, Ülke"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="current_location">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Yaşadığı Yer
                  </Label>
                  <div className="mt-2">
                    <PlaceAutocompleteInput
                      id="current_location"
                      value={profile.current_location}
                      onChange={(value) => setProfile({ ...profile, current_location: value })}
                      placeholder="Şu an yaşadığınız şehir, ülke"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Hakkımda</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Değişiklikleri Kaydet"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Hesap Ayarları</CardTitle>
                <CardDescription>
                  E-posta ve hesap bilgilerinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-posta Adresi
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="ornek@email.com"
                    />
                    <Button
                      onClick={handleChangeEmail}
                      disabled={isSaving || profile.email === ""}
                      variant="outline"
                    >
                      Güncelle
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    E-posta değiştirdiğinizde doğrulama linki gönderilecektir
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik</CardTitle>
                <CardDescription>
                  Şifrenizi ve güvenlik ayarlarınızı yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="new_password">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Yeni Şifre
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="En az 6 karakter"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm_password">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Yeni Şifre (Tekrar)
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Şifrenizi tekrar girin"
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving || !passwords.newPassword || !passwords.confirmPassword}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Değiştiriliyor...
                    </>
                  ) : (
                    "Şifreyi Değiştir"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Bildirim Tercihleri
                </CardTitle>
                <CardDescription>
                  Almak istediğiniz bildirim türlerini yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationPreferences />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionSettings />
          </TabsContent>

          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Engellenen Kullanıcılar
                </CardTitle>
                <CardDescription>
                  Engellediğiniz kullanıcıları görün ve engellerini kaldırın
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBlocked ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz hiç kullanıcı engellemediniz.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blockedUsers.map((blocked) => {
                      const profile = blocked.profiles;
                      return (
                        <div
                          key={blocked.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile?.profile_photo} />
                              <AvatarFallback>
                                {profile?.username?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{profile?.full_name || profile?.username}</p>
                              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockUser(blocked.id)}
                          >
                            Engeli Kaldır
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Görünüm ve Bildirimler</CardTitle>
                  <CardDescription>
                    Uygulamanın görünümünü ve bildirim tercihlerinizi özelleştirin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        Koyu Tema
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Gözlerinizi korumak için koyu temayı kullanın
                      </p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Bildirimler
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Mesajlar ve arkadaşlık istekleri için bildirim alın
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Browser tamamen kapalıyken bildirimler çalışmaz. Browser arka planda açıkken çalışır.
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={toggleNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Tanıtım Turunu Sıfırla
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Platformun özelliklerini tanıtan turu tekrar görüntüle
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetOnboarding("feed-tour");
                        toast({
                          title: "Tur Sıfırlandı",
                          description: "Ana sayfayı yenilediğinizde tur tekrar başlayacak.",
                        });
                      }}
                    >
                      Sıfırla
                    </Button>
                  </div>

                  {notificationsEnabled && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        onClick={handleTestPushNotification}
                        className="w-full gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        Test Push Bildirimi Gönder
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Eşleşme Ekranında Görün
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Profilinizin diğer kullanıcılara gösterilmesini kontrol edin
                      </p>
                    </div>
                    <Switch
                      checked={profile.show_in_matches}
                      onCheckedChange={(checked) => {
                        setProfile({ ...profile, show_in_matches: checked });
                        handleSaveProfile();
                      }}
                    />
                  </div>

                  <div className="pt-6 border-t space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/call-history")}
                      className="w-full gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Arama Geçmişi
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      className="w-full gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <AutoResponseSettings />
              
              <ThemeCustomizationPanel />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
