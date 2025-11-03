import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Search, ArrowLeft, FileText, Smile, Paperclip, Image as ImageIcon, Video } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  analysis_id?: string;
  analysis_type?: string;
}

interface Conversation {
  friend: Friend;
  lastMessage?: Message;
  unreadCount: number;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadConversations();
  }, []); // Only load once on mount

  useEffect(() => {
    if (!currentUserId) return;
    
    // Subscribe to new messages
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          if (selectedFriend) {
            loadMessages(selectedFriend.user_id);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFriend, currentUserId]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Get all accepted friends
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          user_id,
          friend_id,
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (!friendsData) return;

      const friends: Friend[] = friendsData.map((f: any) => {
        // Determine which profile is the friend (not the current user)
        const isSender = f.user_id === user.id;
        const profile = isSender ? f.friend_profile : f.user_profile;
        return {
          user_id: profile.user_id,
          username: profile.username,
          full_name: profile.full_name,
          profile_photo: profile.profile_photo,
        };
      });

      // Get last messages and unread counts for each friend
      const conversationsWithMessages = await Promise.all(
        friends.map(async (friend) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${friend.user_id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${friend.user_id})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", friend.user_id)
            .eq("receiver_id", user.id)
            .eq("read", false);

          return {
            friend,
            lastMessage: lastMsg || undefined,
            unreadCount: count || 0,
          };
        })
      );

      const sortedConversations = conversationsWithMessages.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || "";
        const bTime = b.lastMessage?.created_at || "";
        return bTime.localeCompare(aTime);
      });

      setConversations(sortedConversations);

      // If userId param exists and no friend selected yet, auto-select that friend
      const userIdParam = searchParams.get("userId");
      if (userIdParam && !selectedFriend) {
        const friendToSelect = friends.find(f => f.user_id === userIdParam);
        if (friendToSelect) {
          setSelectedFriend(friendToSelect);
          
          // Load messages for the selected friend
          const { data: messagesData, error: messagesError } = await supabase
            .from("messages")
            .select("*")
            .or(`and(sender_id.eq.${friendToSelect.user_id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${friendToSelect.user_id})`)
            .order("created_at", { ascending: true });

          if (!messagesError && messagesData) {
            setMessages(messagesData);
            
            // Mark messages as read
            await supabase
              .from("messages")
              .update({ read: true })
              .eq("sender_id", friendToSelect.user_id)
              .eq("receiver_id", user.id)
              .eq("read", false);
          }
        }
      }
      
      return { userId: user.id, friends };
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Hata",
        description: "Konuşmalar yüklenemedi.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Parse messages to detect analysis shares
      const parsedMessages = data?.map(msg => {
        const analysisIdMatch = msg.content.match(/\[Analiz ID: ([^\]]+)\]/);
        const analysisTypeMatch = msg.content.match(/\[Analiz Türü: ([^\]]+)\]/);
        if (analysisIdMatch && analysisTypeMatch) {
          return {
            ...msg,
            analysis_id: analysisIdMatch[1],
            analysis_type: analysisTypeMatch[1],
          };
        }
        return msg;
      }) || [];

      setMessages(parsedMessages);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", friendId)
        .eq("receiver_id", currentUserId)
        .eq("read", false);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Hata",
        description: "Mesajlar yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const handleAnalysisClick = async (analysisId: string, analysisType: string) => {
    try {
      let analysisData = null;

      // First check if the analysis is shared with the current user
      const { data: sharedData } = await supabase
        .from("shared_analyses")
        .select("user_id")
        .eq("analysis_id", analysisId)
        .maybeSingle();

      // Check different tables based on analysis type
      if (analysisType === "numerology") {
        const { data } = await supabase
          .from("numerology_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      } else if (analysisType === "birth_chart") {
        const { data } = await supabase
          .from("birth_chart_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      } else if (analysisType === "compatibility") {
        const { data } = await supabase
          .from("compatibility_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      } else if (analysisType === "tarot") {
        const { data } = await supabase
          .from("tarot_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "coffee_fortune") {
        const { data } = await supabase
          .from("coffee_fortune_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "dream") {
        const { data } = await supabase
          .from("dream_interpretations")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "palmistry") {
        const { data } = await supabase
          .from("palmistry_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "daily_horoscope") {
        const { data } = await supabase
          .from("daily_horoscopes")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.horoscope_text } : null;
      } else {
        const { data } = await supabase
          .from("analysis_history")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      }

      if (analysisData) {
        // Check if user has permission to view
        const canView = analysisData.user_id === currentUserId || sharedData;
        
        if (!canView) {
          throw new Error("Bu analizi görüntüleme izniniz yok");
        }

        setSelectedAnalysis({
          ...analysisData,
          analysis_type: analysisType,
        });
        setAnalysisDialogOpen(true);
      } else {
        throw new Error("Analiz bulunamadı");
      }
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast({
        title: "Hata",
        description: error.message || "Analiz yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Maksimum dosya boyutu 10MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    setAttachedFile(file);

    // Create preview for images and videos
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachedFile) || !selectedFriend) return;

    setIsSending(true);
    try {
      let messageContent = newMessage.trim();

      // If there's an attached file, add it to the message
      if (attachedFile) {
        const fileType = attachedFile.type.startsWith("image/") 
          ? "🖼️ Resim" 
          : attachedFile.type.startsWith("video/") 
          ? "🎥 Video" 
          : "📎 Dosya";
        
        messageContent = `${fileType}: ${attachedFile.name}\n${messageContent}`;
        
        if (attachedFilePreview) {
          messageContent += `\n[FILE_PREVIEW:${attachedFilePreview}]`;
        }
      }

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedFriend.user_id,
          content: messageContent,
        });

      if (error) throw error;

      setNewMessage("");
      removeAttachment();
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mesajlar
        </h1>

        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className={`md:col-span-1 p-4 ${isMobile && selectedFriend ? 'hidden' : ''}`}>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Arkadaş ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz mesajınız yok
                  </p>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.friend.user_id}
                      onClick={() => {
                        setSelectedFriend(conv.friend);
                        loadMessages(conv.friend.user_id);
                      }}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedFriend?.user_id === conv.friend.user_id
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={conv.friend.profile_photo} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {conv.friend.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm truncate">
                            {conv.friend.full_name || conv.friend.username}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Panel */}
          <Card className={`md:col-span-2 flex flex-col ${isMobile && !selectedFriend ? 'hidden' : ''}`}>
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFriend(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar 
                    className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => navigate(`/profile/${selectedFriend.username}`)}
                  >
                    <AvatarImage src={selectedFriend.profile_photo} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {selectedFriend.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/profile/${selectedFriend.username}`)}
                  >
                    <p className="font-medium">
                      {selectedFriend.full_name || selectedFriend.username}
                    </p>
                    <p className="text-xs text-muted-foreground">@{selectedFriend.username}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isAnalysisShare = msg.analysis_id;
                      const hasFilePreview = msg.content.includes("[FILE_PREVIEW:");
                      let displayContent = msg.content;
                      let filePreview = null;

                      if (hasFilePreview) {
                        const previewMatch = msg.content.match(/\[FILE_PREVIEW:([^\]]+)\]/);
                        if (previewMatch) {
                          filePreview = previewMatch[1];
                          displayContent = msg.content.replace(/\[FILE_PREVIEW:[^\]]+\]/, "").trim();
                        }
                      }
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                          }`}
                        >
                           {isAnalysisShare ? (
                            <Card
                              className={`max-w-[85%] cursor-pointer hover:shadow-lg transition-all border-2 ${
                                msg.sender_id === currentUserId
                                  ? "bg-primary/5 border-primary/30 hover:border-primary/50"
                                  : "bg-accent/5 border-accent/30 hover:border-accent/50"
                              }`}
                              onClick={() => {
                                if (msg.analysis_type) {
                                  handleAnalysisClick(msg.analysis_id!, msg.analysis_type);
                                } else {
                                  toast({
                                    title: "Hata",
                                    description: "Analiz türü bilgisi bulunamadı.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <div className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="p-2.5 bg-gradient-primary rounded-lg">
                                    <FileText className="w-6 h-6 text-primary-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm mb-1">📊 Analiz Sonucu Paylaşıldı</p>
                                    <p className="text-xs text-muted-foreground">Detayları görmek için tıklayın</p>
                                  </div>
                                </div>
                                {msg.content.split('[Analiz ID:')[0].trim() && (
                                  <p className="text-sm mb-3 px-1">
                                    {msg.content.split('[Analiz ID:')[0].trim()}
                                  </p>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  <p className="text-xs font-medium text-primary">Görüntüle →</p>
                                </div>
                              </div>
                            </Card>
                          ) : (
                            <div
                              className={`max-w-[70%] rounded-lg overflow-hidden ${
                                msg.sender_id === currentUserId
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {filePreview && (
                                <div className="relative">
                                  {displayContent.startsWith("🖼️ Resim") ? (
                                    <img 
                                      src={filePreview} 
                                      alt="Shared" 
                                      className="w-full max-h-64 object-cover"
                                    />
                                  ) : displayContent.startsWith("🎥 Video") ? (
                                    <video 
                                      src={filePreview} 
                                      controls 
                                      className="w-full max-h-64"
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div className="px-4 py-2">
                                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t space-y-3">
                  {/* File Preview */}
                  {attachedFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(attachedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Emoji Picker */}
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" type="button">
                          <Smile className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 border-0" align="start">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </PopoverContent>
                    </Popover>

                    {/* File Attachment */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    {/* Message Input */}
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    
                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !attachedFile) || isSending}
                      size="icon"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Mesajlaşmak için bir arkadaş seçin
              </div>
            )}
          </Card>
        </div>

        {/* Analysis Detail Dialog */}
        <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analiz Detayları</DialogTitle>
              <DialogDescription>
                Paylaşılan analiz sonuçlarını inceleyebilirsiniz
              </DialogDescription>
            </DialogHeader>
            {selectedAnalysis && (
              <AnalysisDetailView
                result={selectedAnalysis.result}
                analysisType={selectedAnalysis.analysis_type}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Messages;
