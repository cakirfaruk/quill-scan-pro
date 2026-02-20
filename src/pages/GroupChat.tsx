import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Users, Settings, Smile, Loader2, UserPlus, BarChart3, Megaphone, Image as ImageIcon, Paperclip, Reply, X, TrendingUp, Search, CalendarDays, Pin, Phone, Video, MoreVertical, LogOut } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  pinned_at?: string | null;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
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
        .select("id, content, media_url, media_type, reply_to, created_at, sender_id, pinned_at")
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
        .select("id, content, media_url, media_type, created_at, sender_id, pinned_at")
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("group-media")
        .getPublicUrl(fileName);

      // Send message with media
      const { error: messageError } = await supabase.from("group_messages").insert({
        group_id: groupId,
        sender_id: currentUserId,
        content: file.type.startsWith("image") ? "📷 Fotoğraf" : "🎥 Video",
        media_url: publicUrl,
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
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-black");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-black");
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent pb-20 relative">
        <PageHeader title="Grup Sohbeti" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-transparent pb-20 relative font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="-mt-6">
        <PageHeader title={group.name || "Grup Sohbeti"} />
      </div>

      {/* Breadcrumb Area */}
      <div className="container mx-auto px-4 mt-2 mb-4">
        <Breadcrumb
          items={[
            { label: "Gruplar", path: "/groups" },
            { label: group.name, path: `/groups/${groupId}` },
          ]}
        />
      </div>

      <div className="container mx-auto px-4 h-[calc(100vh-180px)] flex flex-col gap-4">
        {/* Header Card */}
        <Card className="glass-card border-white/10 p-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden text-white/70" onClick={() => navigate("/groups")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={group.photo_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {group.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="font-semibold text-white leading-none mb-1">{group.name}</h2>
                <p className="text-xs text-white/50">{members.length} üye</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-primary hover:bg-primary/10 rounded-full" onClick={() => startGroupCall("audio")}>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-accent hover:bg-accent/10 rounded-full" onClick={() => startGroupCall("video")}>
                <Video className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/70 rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-white/10 text-white min-w-[200px]">
                  <DropdownMenuItem onClick={() => setSearchOpen(true)} className="hover:bg-white/10 cursor-pointer">
                    <Search className="w-4 h-4 mr-2" /> Ara
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatsOpen(true)} className="hover:bg-white/10 cursor-pointer">
                    <TrendingUp className="w-4 h-4 mr-2" /> İstatistikler
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMediaGalleryOpen(true)} className="hover:bg-white/10 cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2" /> Medya Galerisi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUploadFileDialogOpen(true)} className="hover:bg-white/10 cursor-pointer">
                    <Paperclip className="w-4 h-4 mr-2" /> Dosya Paylaş
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMembersDialogOpen(true)} className="hover:bg-white/10 cursor-pointer">
                    <Users className="w-4 h-4 mr-2" /> Üyeler
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <div className="h-px bg-white/10 my-1" />
                      <DropdownMenuItem onClick={() => setCreateEventDialogOpen(true)} className="hover:bg-white/10 cursor-pointer">
                        <CalendarDays className="w-4 h-4 mr-2" /> Etkinlik Oluştur
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCreateAnnouncementDialogOpen(true)} className="hover:bg-white/10 cursor-pointer">
                        <Megaphone className="w-4 h-4 mr-2" /> Duyuru Yap
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCreatePollDialogOpen(true)} className="hover:bg-white/10 cursor-pointer">
                        <BarChart3 className="w-4 h-4 mr-2" /> Anket Başlat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/groups/${groupId}/settings`)} className="hover:bg-white/10 cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" /> Grup Ayarları
                      </DropdownMenuItem>
                    </>
                  )}

                  <div className="h-px bg-white/10 my-1" />
                  <DropdownMenuItem onClick={handleLeaveGroup} className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" /> Gruptan Ayrıl
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Pinned Messages Bar */}
        <PinnedMessages
          messages={pinnedMessages}
          isAdmin={isAdmin}
          onUnpin={handleUnpinMessage}
          onMessageClick={scrollToMessage}
        />

        {/* Main Chat Area */}
        <Card className="glass-card flex-1 flex flex-col overflow-hidden border-white/10 relative bg-black/40 shadow-2xl backdrop-blur-xl">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {/* Special Cards (Announcements, Events, etc) */}
              <div className="space-y-4">
                {announcements.map(a => (
                  <GroupAnnouncementCard key={a.id} announcement={a} currentUserId={currentUserId} isAdmin={isAdmin} onDelete={loadAnnouncements} />
                ))}
                {events.map(e => (
                  <GroupEventCard key={e.id} event={e} currentUserId={currentUserId} onDelete={loadEvents} />
                ))}
                {files.map(f => (
                  <GroupFileCard key={f.id} file={f} currentUserId={currentUserId} isAdmin={isAdmin} onDelete={loadFiles} />
                ))}
                {polls.map(p => (
                  <GroupPollCard key={p.id} poll={p} currentUserId={currentUserId} isAdmin={isAdmin} onDelete={loadPolls} />
                ))}
              </div>

              {/* Messages */}
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === currentUserId;
                const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                return (
                  <div
                    id={`message-${msg.id}`}
                    key={msg.id}
                    className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} group transform transition-all hover:translate-y-[-1px]`}
                  >
                    {!isMe && (
                      <div className="w-8 flex-shrink-0 flex items-end">
                        {showAvatar ? (
                          <Avatar className="w-8 h-8 ring-1 ring-white/10">
                            <AvatarImage src={msg.sender.profile_photo || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {msg.sender.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : <div className="w-8" />}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[80%] md:max-w-[70%] min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && showAvatar && (
                        <span className="text-[10px] text-white/50 ml-1 mb-1">{msg.sender.full_name || msg.sender.username}</span>
                      )}

                      <div className={`relative px-4 py-2.5 shadow-lg ${isMe
                          ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary via-violet-600 to-violet-700 text-white border-0"
                          : "rounded-2xl rounded-tl-sm bg-white/10 backdrop-blur-md border border-white/10 text-white/90"
                        }`}>
                        {/* Replied Message Context */}
                        {msg.replied_message && (
                          <div className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isMe ? "bg-black/20 border-white/30" : "bg-black/20 border-primary/50"}`}>
                            <p className="font-bold opacity-80 mb-0.5">{msg.replied_message.sender.username}</p>
                            <p className="opacity-70 truncate line-clamp-1">
                              {msg.replied_message.media_url ? (msg.replied_message.media_url.includes("image") ? "📷 Fotoğraf" : "🎥 Video") : msg.replied_message.content}
                            </p>
                          </div>
                        )}

                        {/* Media Content */}
                        {msg.media_url && (
                          <div className="mb-2 rounded-lg overflow-hidden max-w-full">
                            {msg.media_type?.startsWith("image") ? (
                              <img src={msg.media_url} alt="Media" className="max-w-full rounded-lg" />
                            ) : (
                              <video src={msg.media_url} controls className="max-w-full rounded-lg" />
                            )}
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.content && (
                          <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className={`flex items-center gap-1.5 mt-1 select-none ${isMe ? "justify-end text-white/70" : "justify-start text-white/40"}`}>
                          <span className="text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.pinned_at && <Pin className="w-3 h-3 text-accent rotate-45" />}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10 text-white/50" onClick={() => setReplyingTo(msg)} title="Yanıtla">
                          <Reply className="w-3.5 h-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10 text-white/50" onClick={() => handlePinMessage(msg.id)} title="Sabitle">
                            <Pin className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-white/5 backdrop-blur-3xl border-t border-white/10 z-20">
            {replyingTo && (
              <div className="flex items-center justify-between p-2 mb-2 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-bottom-2">
                <div className="flex flex-col text-sm">
                  <span className="text-primary font-bold text-xs">@{replyingTo.sender.username} kişisine yanıt veriliyor</span>
                  <span className="text-white/70 truncate line-clamp-1 text-xs mt-0.5">
                    {replyingTo.media_url ? "📷 Medya" : replyingTo.content}
                  </span>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => setReplyingTo(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-end p-1 focus-within:bg-white/10 focus-within:border-primary/30 transition-all shadow-inner">
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-colors">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-transparent border-none shadow-none" align="start">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                  </PopoverContent>
                </Popover>

                <Input
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] py-3 text-white placeholder:text-white/30"
                  placeholder={replyingTo ? "Yanıtınızı yazın..." : "Bir mesaj yazın..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending || uploading}
                  maxLength={2000}
                />

                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/50 hover:text-accent hover:bg-accent/10 transition-colors" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
                </Button>
              </div>

              <Button
                type="submit"
                size="icon"
                className={`h-12 w-12 rounded-2xl shadow-lg transition-all duration-300 ${newMessage.trim() ? "bg-gradient-to-r from-primary to-violet-600 hover:scale-105" : "bg-white/10 text-white/30 hover:bg-white/20"}`}
                disabled={sending || uploading || !newMessage.trim()}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Grup Üyeleri ({members.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-1 ring-white/10">
                      <AvatarImage src={member.profile.profile_photo || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {member.profile.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white/90">
                        {member.profile.full_name || member.profile.username}
                      </p>
                      <p className="text-xs text-white/50">
                        @{member.profile.username}
                      </p>
                    </div>
                  </div>
                  {member.role === "admin" && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateGroupPollDialog open={createPollDialogOpen} onOpenChange={setCreatePollDialogOpen} groupId={groupId!} onPollCreated={loadPolls} />
      <CreateGroupAnnouncementDialog open={createAnnouncementDialogOpen} onOpenChange={setCreateAnnouncementDialogOpen} groupId={groupId!} onAnnouncementCreated={loadAnnouncements} />
      <GroupMediaGallery open={mediaGalleryOpen} onOpenChange={setMediaGalleryOpen} groupId={groupId!} />
      <GroupStats open={statsOpen} onOpenChange={setStatsOpen} groupId={groupId!} />
      <GroupSearch open={searchOpen} onOpenChange={setSearchOpen} groupId={groupId!} />
      <CreateGroupEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} groupId={groupId!} onEventCreated={loadEvents} />
      <CreateGroupFileDialog open={uploadFileDialogOpen} onOpenChange={setUploadFileDialogOpen} groupId={groupId!} onFileUploaded={loadFiles} />

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
    </div>
  );
};

export default GroupChat;
