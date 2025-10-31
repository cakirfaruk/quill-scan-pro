import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Plus, X, Settings, Calendar, MapPin, Share2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Analysis {
  id: string;
  analysis_type: string;
  created_at: string;
  result: any;
}

const Profile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState({
    user_id: "",
    username: "",
    full_name: "",
    birth_date: "",
    birth_place: "",
    bio: "",
    gender: "",
    profile_photo: "",
  });
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [shareType, setShareType] = useState<"public" | "friends">("friends");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // If no username in URL, show current user's profile
      const targetUsername = username || user.email?.split('@')[0];
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", targetUsername)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setIsOwnProfile(profileData.user_id === user.id);

      // Load photos
      const { data: photosData } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("display_order");

      if (photosData) setPhotos(photosData);

      // Load analyses (only if own profile or shared)
      if (profileData.user_id === user.id) {
        await loadAnalyses(profileData.user_id);
      } else {
        await loadSharedAnalyses(profileData.user_id);
      }

      // Load friends count
      const { data: friendsData } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id.eq.${profileData.user_id},friend_id.eq.${profileData.user_id}`)
        .eq("status", "accepted");

      setFriends(friendsData || []);
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

  const loadAnalyses = async (userId: string) => {
    const types = ['analysis_history', 'numerology_analyses', 'birth_chart_analyses', 'compatibility_analyses'];
    const allAnalyses: Analysis[] = [];

    for (const type of types) {
      const { data } = await supabase
        .from(type as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data) {
        allAnalyses.push(...(data as any[]).map((a: any) => ({
          id: a.id,
          analysis_type: type.replace('_analyses', '').replace('analysis_', ''),
          created_at: a.created_at,
          result: a.result || {},
        })));
      }
    }

    setAnalyses(allAnalyses);
  };

  const loadSharedAnalyses = async (userId: string) => {
    const { data } = await supabase
      .from("shared_analyses")
      .select("*")
      .eq("user_id", userId)
      .or(`shared_with_user_id.eq.${currentUserId},is_public.eq.true`);

    if (data) {
      // Load full analysis details
      const analysesWithDetails = await Promise.all(
        data.map(async (share: any) => {
          const tableName = `${share.analysis_type}_analyses`;
          const { data: analysis } = await supabase
            .from(tableName as any)
            .select("*")
            .eq("id", share.analysis_id)
            .single();

          return analysis ? {
            id: (analysis as any).id,
            analysis_type: share.analysis_type,
            created_at: (analysis as any).created_at,
            result: (analysis as any).result || {},
          } : null;
        })
      );

      setAnalyses(analysesWithDetails.filter(a => a !== null) as Analysis[]);
    }
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    
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
          user_id: currentUserId,
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
    if (!isOwnProfile) return;

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

  const handleShareAnalysis = async () => {
    if (!selectedAnalysis) return;

    try {
      const { error } = await supabase
        .from("shared_analyses")
        .insert({
          user_id: currentUserId,
          analysis_id: selectedAnalysis.id,
          analysis_type: selectedAnalysis.analysis_type,
          is_public: shareType === "public",
          shared_with_user_id: shareType === "friends" && selectedFriendId ? selectedFriendId : null,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: shareType === "public" ? "Analiz herkesle paylaşıldı" : "Analiz arkadaşınızla paylaşıldı",
      });

      setShareDialogOpen(false);
      setSelectedAnalysis(null);
      setSelectedFriendId("");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Analiz paylaşılamadı.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;

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
        .from("profiles")
        .update({ profile_photo: reader.result as string })
        .eq("user_id", currentUserId);

      if (error) {
        toast({
          title: "Hata",
          description: "Profil fotoğrafı güncellenemedi.",
          variant: "destructive",
        });
        return;
      }

      loadProfile();
      toast({
        title: "Başarılı",
        description: "Profil fotoğrafı güncellendi.",
      });
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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative flex-shrink-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary/20">
                <AvatarImage src={profile.profile_photo} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl">
                  {profile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg">
                  <Camera className="w-5 h-5 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                {isOwnProfile && (
                  <Link to="/settings">
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex gap-6 mb-4 text-sm flex-wrap">
                <div>
                  <span className="font-bold">{photos.length}</span> fotoğraf
                </div>
                <div>
                  <span className="font-bold">{analyses.length}</span> analiz
                </div>
                <div>
                  <span className="font-bold">{friends.length}</span> arkadaş
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm mb-3">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile.birth_date && (
                  <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {new Date(profile.birth_date).toLocaleDateString('tr-TR')}
                  </div>
                )}
                {profile.birth_place && (
                  <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {profile.birth_place}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos">Fotoğraflar</TabsTrigger>
            <TabsTrigger value="analyses">Analizler</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isOwnProfile && (
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
                )}

                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square group">
                    <img
                      src={photo.photo_url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-destructive-foreground" />
                      </button>
                    )}
                  </div>
                ))}

                {photos.length === 0 && !isOwnProfile && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Henüz fotoğraf eklenmemiş
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analyses">
            <Card className="p-6">
              {analyses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {isOwnProfile ? "Henüz analiziniz yok" : "Paylaşılmış analiz bulunmuyor"}
                </div>
              ) : (
                <div className="grid gap-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold capitalize mb-1">
                            {analysis.analysis_type.replace('_', ' ')} Analizi
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAnalysis(analysis)}
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Paylaş
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Analizi Paylaş</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    Kimlerle paylaşmak istersiniz?
                                  </label>
                                  <Select value={shareType} onValueChange={(value: any) => setShareType(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="public">Herkes</SelectItem>
                                      <SelectItem value="friends">Sadece Arkadaşlarım</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {shareType === "friends" && (
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Hangi arkadaşınızla?
                                    </label>
                                    <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Arkadaş seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {friends.map((friend) => (
                                          <SelectItem key={friend.id} value={friend.friend_id}>
                                            Arkadaş
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <Button
                                  onClick={handleShareAnalysis}
                                  className="w-full"
                                  disabled={shareType === "friends" && !selectedFriendId}
                                >
                                  Paylaş
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
