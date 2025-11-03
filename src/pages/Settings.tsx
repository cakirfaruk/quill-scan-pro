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
import { Loader2, Calendar, MapPin, Clock, User, Lock, Mail, Moon, Sun, Bell } from "lucide-react";
import { requestNotificationPermission } from "@/utils/notifications";
import { PlaceAutocompleteInput } from "@/components/PlaceAutocompleteInput";

const Settings = () => {
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
    bio: "",
    gender: "",
    email: "",
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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    
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
          bio: newData.bio || "",
          gender: newData.gender || "",
          email: user.email || "",
        });
      } else {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          birth_date: data.birth_date || "",
          birth_time: data.birth_time || "",
          birth_place: data.birth_place || "",
          bio: data.bio || "",
          gender: data.gender || "",
          email: user.email || "",
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
          bio: profile.bio || null,
          gender: profile.gender || null,
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
        setNotificationsEnabled(true);
        toast({
          title: "Bildirimler Aktif",
          description: "Artık önemli güncellemelerden haberdar olacaksınız.",
        });
      } else {
        toast({
          title: "Bildirim İzni Verilmedi",
          description: "Bildirimleri aktif etmek için tarayıcı ayarlarından izin vermeniz gerekiyor.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Bildirimler",
        description: "Bildirimleri kapatmak için tarayıcı ayarlarından izni kaldırabilirsiniz.",
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="account">Hesap</TabsTrigger>
            <TabsTrigger value="security">Güvenlik</TabsTrigger>
            <TabsTrigger value="appearance">Görünüm</TabsTrigger>
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

          <TabsContent value="appearance">
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
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={toggleNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
