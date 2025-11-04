import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Users, Settings, Smile, Loader2, UserPlus, BarChart3, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { z } from "zod";
import { GroupPollCard } from "@/components/GroupPollCard";
import { CreateGroupPollDialog } from "@/components/CreateGroupPollDialog";
import { GroupAnnouncementCard } from "@/components/GroupAnnouncementCard";
import { CreateGroupAnnouncementDialog } from "@/components/CreateGroupAnnouncementDialog";

const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Mesaj boş olamaz")
    .max(2000, "Mesaj çok uzun (maksimum 2000 karakter)"),
});

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

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

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createPollDialogOpen, setCreatePollDialogOpen] = useState(false);
  const [createAnnouncementDialogOpen, setCreateAnnouncementDialogOpen] = useState(false);

  useEffect(() => {
    loadGroup();
    loadMessages();
    loadMembers();
    loadPolls();
    loadAnnouncements();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    // Subscribe to polls
    const pollsChannel = supabase
      .channel(`group-polls-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_polls",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadPolls();
        }
      )
      .subscribe();

    // Subscribe to announcements
    const announcementsChannel = supabase
      .channel(`group-announcements-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_announcements",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [groupId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadGroup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroup(data);

      // Check if user is admin
      const { data: memberData } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      setIsAdmin(memberData?.role === "admin");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Grup bilgileri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Get sender profiles separately
      const senderIds = [...new Set((data || []).map((msg: any) => msg.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", senderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      setMessages(
        (data || []).map((msg: any) => ({
          ...msg,
          sender: profileMap.get(msg.sender_id) || {
            username: "Bilinmeyen",
            full_name: null,
            profile_photo: null,
          },
        }))
      );
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("id, user_id, role")
        .eq("group_id", groupId);

      if (error) throw error;

      // Get profiles separately
      const userIds = (data || []).map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      setMembers(
        (data || []).map((member: any) => ({
          ...member,
          profile: profileMap.get(member.user_id) || {
            username: "Bilinmeyen",
            full_name: null,
            profile_photo: null,
          },
        }))
      );
    } catch (error: any) {
      console.error("Error loading members:", error);
    }
  };

  const loadPolls = async () => {
    try {
      const { data, error } = await supabase
        .from("group_polls")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPolls(data || []);
    } catch (error: any) {
      console.error("Error loading polls:", error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("group_announcements")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error("Error loading announcements:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      // Validate message
      const validation = messageSchema.safeParse({ content: newMessage });
      if (!validation.success) {
        toast({
          title: "Geçersiz Mesaj",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      setSending(true);

      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Gruptan ayrılmak istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Gruptan ayrıldınız",
      });

      navigate("/groups");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Gruptan ayrılamadınız",
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

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <Header />

      {/* Group Header */}
      <Card className="mx-4 mt-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-12 h-12">
              <AvatarImage src={group.photo_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {group.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-semibold">{group.name}</h2>
              <p className="text-xs text-muted-foreground">
                {members.length} üye
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreateAnnouncementDialogOpen(true)}
                  title="Duyuru Oluştur"
                >
                  <Megaphone className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreatePollDialogOpen(true)}
                  title="Anket Oluştur"
                >
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMembersDialogOpen(true)}
            >
              <Users className="w-5 h-5" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/groups/${groupId}/settings`)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 mx-4 my-4 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {/* Announcements */}
            {announcements.map((announcement) => (
              <GroupAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={loadAnnouncements}
              />
            ))}

            {/* Polls */}
            {polls.map((poll) => (
              <GroupPollCard
                key={poll.id}
                poll={poll}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={loadPolls}
              />
            ))}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender_id === currentUserId ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={msg.sender.profile_photo || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {msg.sender.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex-1 max-w-[70%] ${
                    msg.sender_id === currentUserId ? "text-right" : ""
                  }`}
                >
                  {msg.sender_id !== currentUserId && (
                    <p className="text-xs font-medium mb-1">
                      {msg.sender.full_name || msg.sender.username}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 inline-block ${
                      msg.sender_id === currentUserId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </PopoverContent>
            </Popover>

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesaj yaz..."
              disabled={sending}
              maxLength={2000}
            />

            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grup Üyeleri ({members.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
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
                  {member.role === "admin" && (
                    <span className="text-xs text-primary font-medium">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          {isAdmin && (
            <Button className="w-full mt-4" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Üye Ekle
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleLeaveGroup}
            className="w-full"
          >
            Gruptan Ayrıl
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create Poll Dialog */}
      <CreateGroupPollDialog
        open={createPollDialogOpen}
        onOpenChange={setCreatePollDialogOpen}
        groupId={groupId!}
        onPollCreated={loadPolls}
      />

      {/* Create Announcement Dialog */}
      <CreateGroupAnnouncementDialog
        open={createAnnouncementDialogOpen}
        onOpenChange={setCreateAnnouncementDialogOpen}
        groupId={groupId!}
        onAnnouncementCreated={loadAnnouncements}
      />
    </div>
  );
};

export default GroupChat;
