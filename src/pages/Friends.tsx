import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Loader2, Search, Check, X, User, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";
import { FriendSuggestions } from "@/components/FriendSuggestions";
import { SkeletonList } from "@/components/ui/enhanced-skeleton";

interface Profile {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friend_profile?: Profile;
  user_profile?: Profile;
}

const Friends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setCurrentUserId(user.id);

      // Load accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo),
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendsError) throw friendsError;
      setFriends(friendsData as any || []);

      // Load pending requests received
      const { data: pendingData, error: pendingError } = await supabase
        .from("friends")
        .select(`
          *,
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (pendingError) throw pendingError;
      setPendingRequests(pendingData as any || []);

      // Load sent requests
      const { data: sentData, error: sentError } = await supabase
        .from("friends")
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (sentError) throw sentError;
      setSentRequests(sentData as any || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq("user_id", user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Arama yapılamadı.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Arkadaşlık isteği gönderildi.",
      });

      loadData();
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İstek gönderilemedi.",
        variant: "destructive",
      });
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from("friends")
          .update({ status: "accepted" })
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Arkadaşlık isteği kabul edildi.",
        });
      } else {
        const { error } = await supabase
          .from("friends")
          .delete()
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Arkadaşlık isteği reddedildi.",
        });
      }

      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem tamamlanamadı.",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Arkadaş silindi.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Arkadaş silinemedi.",
        variant: "destructive",
      });
    }
  };

  const ProfileAvatar = ({ profile }: { profile: Profile }) => (
    <div className="flex items-center gap-3 flex-1">
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profile.profile_photo || undefined} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
            {profile.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <p className="font-semibold">{profile.full_name || profile.username}</p>
        {profile.full_name && (
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        )}
        <OnlineStatusBadge userId={profile.user_id} showLastSeen={false} size="sm" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle pb-20 lg:pb-0">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 max-w-5xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Arkadaşlarım
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Arkadaş ekleyin ve arkadaşlarınızla analiz yapın
            </p>
          </div>
          <Card className="p-4 sm:p-6">
            <SkeletonList count={6} />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20 lg:pb-0">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Arkadaşlarım
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Arkadaş ekleyin ve arkadaşlarınızla analiz yapın
          </p>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Arkadaşlar
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests">
              İstekler
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="search">
              <UserPlus className="w-4 h-4 mr-2" />
              Ekle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card className="p-4 sm:p-6">
              {friends.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="relative inline-block mb-4">
                    <Users className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground/50" />
                    <div className="absolute inset-0 blur-2xl bg-muted-foreground/10" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Henüz arkadaşınız yok</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
                    Yeni arkadaşlar eklemek için "Ekle" sekmesini kullanın
                  </p>
                  <Button onClick={() => (document.querySelector('[value="search"]') as HTMLElement)?.click()} variant="outline" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Arkadaş Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => {
                    // Determine which profile to show (not the current user)
                    const profile = friend.user_id === currentUserId 
                      ? friend.friend_profile 
                      : friend.user_profile;
                    
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/profile/${profile?.username}`)}
                      >
                        <ProfileAvatar profile={profile as Profile} />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages?userId=${profile?.user_id}`);
                            }}
                          >
                            Mesaj
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFriend(friend.id);
                            }}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* Received Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Gelen İstekler</h3>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Check className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Gelen arkadaşlık isteği yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <ProfileAvatar profile={request.user_profile as Profile} />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => respondToRequest(request.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => respondToRequest(request.id, false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Gönderilen İstekler</h3>
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Send className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30 rotate-45" />
                      <p className="text-sm text-muted-foreground">Gönderilen arkadaşlık isteği yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <ProfileAvatar profile={request.friend_profile as Profile} />
                          <Badge variant="secondary">Bekliyor</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-4">
              <FriendSuggestions />
              
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Kullanıcı Ara</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kullanıcı adı veya isim ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      {searchResults.map((profile) => (
                        <div
                          key={profile.user_id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <ProfileAvatar profile={profile} />
                          <Button
                            size="sm"
                            onClick={() => sendFriendRequest(profile.user_id)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Ekle
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Friends;