import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar, MapPin, Clock, Loader2, Camera, Plus, X, Play, Share2, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
}

interface UserVideo {
  id: string;
  video_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  created_at: string;
}

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
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");

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

      setUserId(user.id);

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

      // Load photos
      const { data: photosData } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order");

      if (photosData) setPhotos(photosData);

      // Load videos
      const { data: videosData } = await supabase
        .from("user_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (videosData) setVideos(videosData);
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

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onloadend = async () => {
      const { error } = await supabase
        .from("user_photos")
        .insert({
          user_id: userId,
          photo_url: reader.result as string,
          display_order: photos.length,
        });

      if (error) {
        toast({
          title: "Hata",
          description: "Fotoğraf eklenemedi.",
          variant: "destructive",
        });
        return;
      }

      loadProfile();
      toast({
        title: "Başarılı",
        description: "Fotoğraf eklendi.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photoId: string) => {
    const { error } = await supabase
      .from("user_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf silinemedi.",
        variant: "destructive",
      });
      return;
    }

    loadProfile();
    toast({
      title: "Başarılı",
      description: "Fotoğraf silindi.",
    });
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header - Social Media Style */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Photo */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary/20">
                <AvatarImage src={profile.profile_photo} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl">
                  {profile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 p-2.5 bg-primary rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
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

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
                </Button>
              </div>

              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <span className="font-bold">{photos.length}</span> fotoğraf
                </div>
                <div>
                  <span className="font-bold">{videos.length}</span> video
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">Arkadaşlar</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm mb-3">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {profile.birth_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(profile.birth_date).toLocaleDateString('tr-TR')}
                  </div>
                )}
                {profile.birth_place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.birth_place}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs for different content */}
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="photos">Fotoğraflar</TabsTrigger>
            <TabsTrigger value="videos">Videolar</TabsTrigger>
            <TabsTrigger value="info">Bilgiler</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Add Photo Button */}
                <label className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Fotoğraf Ekle</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddPhoto}
                  />
                </label>

                {/* Photo Grid */}
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square group">
                    <img
                      src={photo.photo_url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-destructive-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card className="p-6">
              <div className="text-center py-12">
                <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Video yükleme özelliği yakında eklenecek</p>
                <Button disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Video Ekle
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="p-6">
              <div className="space-y-6 max-w-2xl">
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
                  <Input
                    id="birth_place"
                    value={profile.birth_place}
                    onChange={(e) => setProfile({ ...profile, birth_place: e.target.value })}
                    placeholder="Şehir, Ülke"
                    className="mt-2"
                  />
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;