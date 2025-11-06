import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Users, Settings, Smile, Loader2, UserPlus, BarChart3, Megaphone, Image as ImageIcon, Paperclip, Reply, X, TrendingUp, Search, CalendarDays, Pin, Phone, Video } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { z } from "zod";
import { GroupPollCard } from "@/components/GroupPollCard";
import { CreateGroupPollDialog } from "@/components/CreateGroupPollDialog";
import { GroupAnnouncementCard } from "@/components/GroupAnnouncementCard";
import { CreateGroupAnnouncementDialog } from "@/components/CreateGroupAnnouncementDialog";
import { GroupMediaGallery } from "@/components/GroupMediaGallery";
import { GroupStats } from "@/components/GroupStats";
import { GroupSearch } from "@/components/GroupSearch";
import { GroupEventCard } from "@/components/GroupEventCard";
import { CreateGroupEventDialog } from "@/components/CreateGroupEventDialog";
import { GroupFileCard } from "@/components/GroupFileCard";
import { CreateGroupFileDialog } from "@/components/CreateGroupFileDialog";
import { PinnedMessages } from "@/components/PinnedMessages";
import { GroupVideoCallDialog } from "@/components/GroupVideoCallDialog";
import { useLongPress } from "@/hooks/use-gestures";
import { useIsMobile } from "@/hooks/use-mobile";

const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Mesaj boş olamaz")
    .max(2000, "Mesaj çok uzun (maksimum 2000 karakter)"),
});

interface GroupMessage {
  id: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  reply_to?: string | null;
  created_at: string;
  sender_id: string;
  sender: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  replied_message?: {
    content: string;
    media_url?: string | null;
    sender: {
      username: string;
    };
  } | null;
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
  const [events, setEvents] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createPollDialogOpen, setCreatePollDialogOpen] = useState(false);
  const [createAnnouncementDialogOpen, setCreateAnnouncementDialogOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [uploadFileDialogOpen, setUploadFileDialogOpen] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Long press handler for mobile menu
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (isMobile) {
        setShowMobileMenu(true);
      }
    },
    delay: 500,
  });

  useEffect(() => {
    loadGroup();
    loadMessages();
    loadMembers();
    loadPolls();
    loadAnnouncements();
    loadEvents();
    loadFiles();
    loadPinnedMessages();
    
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

    // Subscribe to events
    const eventsChannel = supabase
      .channel(`group-events-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_events",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    // Subscribe to files
    const filesChannel = supabase
      .channel(`group-files-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_files",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadFiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(filesChannel);
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

      // First check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) {
        console.error("Error checking membership:", memberError);
        throw memberError;
      }

      if (!memberData) {
        toast({
          title: "Erişim Reddedildi",
          description: "Bu gruba erişim izniniz yok",
          variant: "destructive",
        });
        navigate("/groups");
        return;
      }

      setIsAdmin(memberData.role === "admin");

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) {
        console.error("Error loading group:", error);
        throw error;
      }
      setGroup(data);
    } catch (error: any) {
      console.error("Error in loadGroup:", error);
      toast({
        title: "Hata",
        description: error.message || "Grup bilgileri yüklenemedi",
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
        .select("id, content, media_url, media_type, reply_to, created_at, sender_id")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map((msg: any) => msg.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", senderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      // Get replied messages
      const replyIds = (data || [])
        .filter((msg: any) => msg.reply_to)
        .map((msg: any) => msg.reply_to);
      
      const { data: repliedMessages } = replyIds.length > 0
        ? await supabase
            .from("group_messages")
            .select("id, content, media_url, sender_id")
            .in("id", replyIds)
        : { data: [] };

      const repliedMessageMap = new Map(
        (repliedMessages || []).map((msg: any) => [
          msg.id,
          {
            content: msg.content,
            media_url: msg.media_url,
            sender: profileMap.get(msg.sender_id) || { username: "Bilinmeyen" },
          },
        ])
      );

      setMessages(
        (data || []).map((msg: any) => ({
          ...msg,
          sender: profileMap.get(msg.sender_id) || {
            username: "Bilinmeyen",
            full_name: null,
            profile_photo: null,
          },
          replied_message: msg.reply_to ? repliedMessageMap.get(msg.reply_to) : null,
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

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error loading events:", error);
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("group_files")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get uploader profiles
      const uploaderIds = [...new Set((data || []).map((file: any) => file.uploaded_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", uploaderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      setFiles(
        (data || []).map((file: any) => ({
          ...file,
          uploader: profileMap.get(file.uploaded_by),
        }))
      );
    } catch (error: any) {
      console.error("Error loading files:", error);
    }
  };

  const loadPinnedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select("id, content, media_url, media_type, created_at, sender_id")
        .eq("group_id", groupId)
        .not("pinned_at", "is", null)
        .order("pinned_at", { ascending: false });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((data || []).map((msg: any) => msg.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", senderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      setPinnedMessages(
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
      console.error("Error loading pinned messages:", error);
    }
  };

  const startGroupCall = async (type: "audio" | "video") => {
    if (!groupId || !currentUserId) return;

    try {
      // Create group call
      const { data: groupCall, error: callError } = await supabase
        .from("group_calls")
        .insert({
          group_id: groupId,
          call_type: type,
          status: "ringing",
          started_by: currentUserId,
        })
        .select()
        .single();

      if (callError) throw callError;

      // Add all group members as participants
      const participantInserts = members
        .filter(m => m.user_id !== currentUserId)
        .map(m => ({
          call_id: groupCall.id,
          user_id: m.user_id,
          status: "invited",
        }));

      if (participantInserts.length > 0) {
        const { error: participantsError } = await supabase
          .from("group_call_participants")
          .insert(participantInserts);

        if (participantsError) throw participantsError;
      }

      // Add self as joined
      await supabase
        .from("group_call_participants")
        .insert({
          call_id: groupCall.id,
          user_id: currentUserId,
          status: "joined",
        });

      setActiveCallId(groupCall.call_id);
      setCallType(type);
      setShowCallInterface(true);

      console.log("Group call initiated:", groupCall);
    } catch (error) {
      console.error("Error starting group call:", error);
      toast({
        title: "Arama Başlatılamadı",
        description: "Grup araması başlatılırken bir hata oluştu.",
        variant: "destructive",
      });
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
        reply_to: replyingTo?.id || null,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Hata",
        description: "Sadece resim (JPG, PNG, WEBP) ve video (MP4, WEBM) dosyaları yüklenebilir",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 20MB'dan küçük olmalı",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}/${groupId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("group-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL (1 year expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("group-media")
        .createSignedUrl(fileName, 31536000); // 365 days

      if (signedError) throw signedError;

      // Send message with media
      const { error: messageError } = await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: currentUserId,
        content: file.type.startsWith("image") ? "📷 Fotoğraf" : "🎥 Video",
        media_url: signedData.signedUrl,
        media_type: file.type,
      });

      if (messageError) throw messageError;

      toast({
        title: "Başarılı",
        description: "Medya paylaşıldı",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Medya yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const handlePinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("group_messages")
        .update({
          pinned_at: new Date().toISOString(),
          pinned_by: currentUserId,
        })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Mesaj sabitlendi",
      });

      loadPinnedMessages();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj sabitlenemedi",
        variant: "destructive",
      });
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("group_messages")
        .update({
          pinned_at: null,
          pinned_by: null,
        })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Sabitleme kaldırıldı",
      });

      loadPinnedMessages();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Sabitleme kaldırılamadı",
        variant: "destructive",
      });
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
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

      <div className="mx-4 mt-4">
        <Breadcrumb
          items={[
            { label: "Gruplar", path: "/groups" },
            { label: group.name, path: `/groups/${groupId}` },
          ]}
        />
      </div>

      {/* Group Header */}
      <Card className="mx-4 mt-2">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startGroupCall("audio")}
              title="Sesli Grup Araması"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startGroupCall("video")}
              title="Görüntülü Grup Araması"
            >
              <Video className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Ara"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStatsOpen(true)}
              title="İstatistikler"
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMediaGalleryOpen(true)}
              title="Medya Galerisi"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUploadFileDialogOpen(true)}
              title="Dosya Paylaş"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreateEventDialogOpen(true)}
                  title="Etkinlik Oluştur"
                >
                  <CalendarDays className="w-5 h-5" />
                </Button>
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

      {/* Pinned Messages */}
      <PinnedMessages
        messages={pinnedMessages}
        isAdmin={isAdmin}
        onUnpin={handleUnpinMessage}
        onMessageClick={scrollToMessage}
      />

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

            {/* Events */}
            {events.map((event) => (
              <GroupEventCard
                key={event.id}
                event={event}
                currentUserId={currentUserId}
                onDelete={loadEvents}
              />
            ))}

            {/* Files */}
            {files.map((file) => (
              <GroupFileCard
                key={file.id}
                file={file}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={loadFiles}
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
                id={`message-${msg.id}`}
                key={msg.id}
                className={`flex gap-3 transition-all ${
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
                  <div className="relative group">
                    <div
                      className={`rounded-lg overflow-hidden ${
                        msg.media_url ? "" : "px-4 py-2"
                      } inline-block ${
                        msg.sender_id === currentUserId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {/* Replied Message */}
                      {msg.replied_message && (
                        <div
                          className={`px-3 py-2 mb-2 border-l-2 ${
                            msg.sender_id === currentUserId
                              ? "border-primary-foreground/30 bg-primary/20"
                              : "border-primary/50 bg-accent/50"
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {msg.replied_message.sender.username}
                          </p>
                          <p className="text-xs opacity-80 truncate">
                            {msg.replied_message.media_url
                              ? msg.replied_message.media_url.includes("image")
                                ? "📷 Fotoğraf"
                                : "🎥 Video"
                              : msg.replied_message.content}
                          </p>
                        </div>
                      )}

                      {/* Message Content */}
                      {msg.media_url ? (
                        <div>
                          {msg.media_type?.startsWith("image") ? (
                            <img
                              src={msg.media_url}
                              alt="Paylaşılan medya"
                              className="max-w-[300px] max-h-[300px] object-cover"
                            />
                          ) : (
                            <video
                              src={msg.media_url}
                              controls
                              className="max-w-[300px] max-h-[300px]"
                            />
                          )}
                          {msg.content && (
                            <p className="text-sm px-4 py-2">{msg.content}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>

                    {/* Reply Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                        msg.sender_id === currentUserId ? "left-0" : "right-0"
                      }`}
                      onClick={() => setReplyingTo(msg)}
                      title="Yanıtla"
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                    
                    {/* Pin Button (Admin Only) */}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          msg.sender_id === currentUserId ? "left-10" : "right-10"
                        }`}
                        onClick={() => handlePinMessage(msg.id)}
                        title="Sabitle"
                      >
                        <Pin className="w-3 h-3" />
                      </Button>
                    )}
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
          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-2 p-2 bg-accent/50 rounded-lg flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="w-3 h-3 text-primary" />
                  <p className="text-xs font-semibold">
                    {replyingTo.sender.username}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.media_url
                    ? replyingTo.media_url.includes("image")
                      ? "📷 Fotoğraf"
                      : "🎥 Video"
                    : replyingTo.content}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-1 md:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
              className="hidden"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 w-8 md:h-10 md:w-10 shrink-0"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>

            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                  <Smile className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </PopoverContent>
            </Popover>

            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? "Yanıt yaz..." : "Mesaj yaz..."}
              disabled={sending || uploading}
              maxLength={2000}
              className="flex-1 min-w-0"
              {...longPressHandlers}
            />

            <Button type="submit" disabled={sending || uploading || !newMessage.trim()} className="h-8 w-8 md:h-10 md:w-10 shrink-0">
              {sending ? (
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 md:w-4 md:h-4" />
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

      {/* Media Gallery */}
      <GroupMediaGallery
        open={mediaGalleryOpen}
        onOpenChange={setMediaGalleryOpen}
        groupId={groupId!}
      />

      {/* Group Stats */}
      <GroupStats
        open={statsOpen}
        onOpenChange={setStatsOpen}
        groupId={groupId!}
      />

      {/* Group Search */}
      <GroupSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        groupId={groupId!}
      />

      {/* Create Event Dialog */}
      <CreateGroupEventDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        groupId={groupId!}
        onEventCreated={loadEvents}
      />

      {/* Upload File Dialog */}
      <CreateGroupFileDialog
        open={uploadFileDialogOpen}
        onOpenChange={setUploadFileDialogOpen}
        groupId={groupId!}
        onFileUploaded={loadFiles}
      />

      {/* Group Video Call */}
      {showCallInterface && activeCallId && (
        <GroupVideoCallDialog
          isOpen={showCallInterface}
          onClose={() => {
            setShowCallInterface(false);
            setActiveCallId(null);
          }}
          callId={activeCallId}
          groupId={groupId!}
          groupName={group?.name || "Grup"}
          groupPhoto={group?.photo_url}
          callType={callType}
        />
      )}

      {/* Mobile Options Menu */}
      <Drawer open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mesaj Seçenekleri</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => {
                fileInputRef.current?.click();
                setShowMobileMenu(false);
              }}
            >
              <Paperclip className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Fotoğraf/Video</div>
                <div className="text-xs text-muted-foreground">Dosya paylaş</div>
              </div>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default GroupChat;
