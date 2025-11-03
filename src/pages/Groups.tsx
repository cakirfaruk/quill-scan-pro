import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Group {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  member_count: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
  is_admin: boolean;
}

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setCurrentUserId(user.id);

      // Get groups user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          role,
          groups (
            id,
            name,
            description,
            photo_url,
            created_at
          )
        `)
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const groupsWithData = await Promise.all(
        (memberData || []).map(async (membership: any) => {
          const group = membership.groups;

          // Get member count
          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          // Get last message
          const { data: lastMessages } = await supabase
            .from("group_messages")
            .select(`
              content,
              created_at,
              sender_id
            `)
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1);

          let lastMessage;
          if (lastMessages && lastMessages[0]) {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("user_id", lastMessages[0].sender_id)
              .single();

            lastMessage = {
              content: lastMessages[0].content,
              created_at: lastMessages[0].created_at,
              sender_name: senderProfile?.username || "Bilinmeyen",
            };
          }

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            photo_url: group.photo_url,
            created_at: group.created_at,
            member_count: memberCount || 0,
            last_message: lastMessage,
            is_admin: membership.role === "admin",
          };
        })
      );

      setGroups(groupsWithData);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Gruplar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Hata",
        description: "Grup adı gerekli",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: currentUserId,
          role: "admin",
        });

      if (memberError) throw memberError;

      toast({
        title: "Başarılı",
        description: "Grup oluşturuldu",
      });

      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      await loadGroups();
      navigate(`/groups/${groupData.id}`);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Grup oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gruplar
          </h1>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Grup Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Grup Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Grup adı"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Textarea
                  placeholder="Açıklama (isteğe bağlı)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
                <Button
                  onClick={handleCreateGroup}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    "Oluştur"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Henüz grup yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arkadaşlarınızla grup sohbetleri başlatın
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Grubunuzu Oluşturun
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={group.photo_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                      {group.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      {group.is_admin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {group.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.member_count} üye
                      </div>
                      {group.last_message && (
                        <>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                              {group.last_message.sender_name}:{" "}
                              {group.last_message.content}
                            </span>
                          </div>
                          <span>
                            {formatDistanceToNow(
                              new Date(group.last_message.created_at),
                              { addSuffix: true, locale: tr }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Groups;
