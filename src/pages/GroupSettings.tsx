import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, UserPlus, UserMinus, Loader2, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb } from "@/components/Breadcrumb";

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

const GroupSettings = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      // Load group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      setGroup(groupData);
      setGroupName(groupData.name);
      setGroupDesc(groupData.description || "");

      // Check if user is admin
      const { data: memberData } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (!memberData || memberData.role !== "admin") {
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya erişim yetkiniz yok",
          variant: "destructive",
        });
        navigate(`/groups/${groupId}`);
        return;
      }

      setIsAdmin(true);
      await loadMembers();
      await loadFriends(user.id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Grup ayarları yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from("group_members")
      .select("id, user_id, role")
      .eq("group_id", groupId);

    if (!data) return;

    const userIds = data.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, profile_photo")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setMembers(
      data.map((member: any) => ({
        ...member,
        profile: profileMap.get(member.user_id) || {
          username: "Bilinmeyen",
          full_name: null,
          profile_photo: null,
        },
      }))
    );
  };

  const loadFriends = async (userId: string) => {
    const { data: friendsData } = await supabase
      .from("friends")
      .select(`
        user_id,
        friend_id
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    if (!friendsData) return;

    const friendIds = friendsData.map((f: any) =>
      f.user_id === userId ? f.friend_id : f.user_id
    );

    // Filter out users already in the group
    const memberIds = new Set(members.map((m) => m.user_id));
    const availableFriendIds = friendIds.filter((id) => !memberIds.has(id));

    if (availableFriendIds.length === 0) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, profile_photo")
      .in("user_id", availableFriendIds);

    setFriends(profiles || []);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Hata",
        description: "Grup adı gerekli",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("groups")
        .update({
          name: groupName.trim(),
          description: groupDesc.trim() || null,
        })
        .eq("id", groupId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Grup bilgileri güncellendi",
      });

      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Grup güncellenemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir arkadaş seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      const members = Array.from(selectedFriends).map((userId) => ({
        group_id: groupId,
        user_id: userId,
        role: "member",
      }));

      const { error } = await supabase.from("group_members").insert(members);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `${selectedFriends.size} üye eklendi`,
      });

      setAddMemberDialogOpen(false);
      setSelectedFriends(new Set());
      await loadMembers();
      await loadFriends(currentUserId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Üyeler eklenemedi",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === currentUserId) {
      toast({
        title: "Uyarı",
        description: "Kendinizi çıkaramazsınız",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Bu üyeyi gruptan çıkarmak istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Üye gruptan çıkarıldı",
      });

      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Üye çıkarılamadı",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdmin = async (memberId: string, currentRole: string, userId: string) => {
    if (userId === currentUserId) {
      toast({
        title: "Uyarı",
        description: "Kendi rolünüzü değiştiremezsiniz",
        variant: "destructive",
      });
      return;
    }

    try {
      const newRole = currentRole === "admin" ? "member" : "admin";

      const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Rol ${newRole === "admin" ? "admin" : "üye"} olarak güncellendi`,
      });

      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Rol güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!")) return;

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Grup silindi",
      });

      navigate("/groups");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Grup silinemedi",
        variant: "destructive",
      });
    }
  };

  if (loading) {
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Breadcrumb
          items={[
            { label: "Gruplar", path: "/groups" },
            { label: group?.name || "Grup", path: `/groups/${groupId}` },
            { label: "Ayarlar", path: `/groups/${groupId}/settings` },
          ]}
        />
        
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/groups/${groupId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Grup Ayarları</h1>
        </div>

        <div className="space-y-6">
          {/* Group Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Grup Bilgileri</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Grup Adı</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Grup adı"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Açıklama</label>
                <Textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Grup açıklaması"
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveGroup} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Members Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Üyeler ({members.length})</h2>
              <Button
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                disabled={friends.length === 0}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Üye Ekle
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profile.profile_photo || undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {member.profile.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profile.full_name || member.profile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{member.profile.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role === "admin" && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                    {member.user_id !== currentUserId && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdmin(member.id, member.role, member.user_id)}
                        >
                          {member.role === "admin" ? "Üye Yap" : "Admin Yap"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive">
            <h2 className="text-lg font-semibold mb-4 text-destructive">Tehlikeli Bölge</h2>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Grubu Sil
            </Button>
          </Card>
        </div>
      </main>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Eklenebilecek arkadaş kalmadı
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg"
                  >
                    <Checkbox
                      checked={selectedFriends.has(friend.user_id)}
                      onCheckedChange={(checked) => {
                        const newSelection = new Set(selectedFriends);
                        if (checked) {
                          newSelection.add(friend.user_id);
                        } else {
                          newSelection.delete(friend.user_id);
                        }
                        setSelectedFriends(newSelection);
                      }}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.profile_photo || undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {friend.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {friend.full_name || friend.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAddMembers}
              disabled={selectedFriends.size === 0}
              className="w-full"
            >
              {selectedFriends.size > 0
                ? `${selectedFriends.size} Kişiyi Ekle`
                : "Üye Seç"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupSettings;
