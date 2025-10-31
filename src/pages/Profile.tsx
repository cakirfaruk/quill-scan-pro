import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, MapPin, Clock, Loader2, Camera } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    birth_date: "",
    birth_time: "",
    birth_place: "",
    bio: "",
    gender: "",
    profile_photo: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          username: data.username || "",
          full_name: data.full_name || "",
          birth_date: data.birth_date || "",
          birth_time: data.birth_time || "",
          birth_place: data.birth_place || "",
          bio: data.bio || "",
          gender: data.gender || "",
          profile_photo: data.profile_photo || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Profil yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          birth_date: profile.birth_date || null,
          birth_time: profile.birth_time || null,
          birth_place: profile.birth_place || null,
          bio: profile.bio || null,
          gender: profile.gender || null,
          profile_photo: profile.profile_photo || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Profiliniz güncellendi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Profil güncellenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profile_photo: reader.result as string });
    };
    reader.readAsDataURL(file);
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

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Profilim
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Kişisel bilgilerinizi güncelleyin
          </p>
        </div>

        <Card className="p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {profile.profile_photo ? (
                  <img
                    src={profile.profile_photo}
                    alt="Profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-16 h-16 text-primary-foreground" />
                  </div>
                )}
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-5 h-5 text-primary-foreground" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* Username (Read-only) */}
            <div>
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={profile.username}
                disabled
                className="mt-2 bg-muted"
              />
            </div>

            {/* Full Name */}
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

            {/* Gender */}
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

            {/* Birth Date */}
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

            {/* Birth Time */}
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

            {/* Birth Place */}
            <div>
              <Label htmlFor="birth_place">
                <MapPin className="w-4 h-4 inline mr-2" />
                Doğum Yeri
              </Label>
              <Input
                id="birth_place"
                value={profile.birth_place}
                onChange={(e) => setProfile({ ...profile, birth_place: e.target.value })}
                placeholder="Şehir, Ülke"
                className="mt-2"
              />
            </div>

            {/* Bio */}
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

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Profile;