import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Loader2, Send, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface ShareAnalysisToMessagesButtonProps {
  analysisId?: string;
  analysisType: string;
  title: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ShareAnalysisToMessagesButton = ({ 
  analysisId,
  analysisType,
  title,
  variant = "outline", 
  size = "sm",
  className = ""
}: ShareAnalysisToMessagesButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFriends = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;

      // Get all users this person has messaged
      const { data: sentMessages } = await supabase
        .from("messages")
        .select("receiver_id")
        .eq("sender_id", user.id);

      const { data: receivedMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user.id);

      const uniqueUserIds = new Set([
        ...(sentMessages?.map(m => m.receiver_id) || []),
        ...(receivedMessages?.map(m => m.sender_id) || [])
      ]);

      if (uniqueUserIds.size === 0) {
        setFriends([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", Array.from(uniqueUserIds));

      setFriends(profiles || []);
    } catch (error) {
      console.error('Load friends error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDialog) {
      loadFriends();
    }
  }, [showDialog]);

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSend = async () => {
    if (!user?.id) {
      toast({
        title: "Hata",
        description: "Göndermek için giriş yapmalısınız",
        variant: "destructive"
      });
      return;
    }

    if (selectedFriends.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir kişi seçin",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Send analysis to selected friends
      const messages = Array.from(selectedFriends).map(friendId => ({
        sender_id: user.id,
        receiver_id: friendId,
        content: `📊 ${title} - Analiz sonucumu seninle paylaşmak istedim!`,
        analysis_id: analysisId,
        analysis_type: analysisType,
        message_category: 'friend' as const
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Analiz ${selectedFriends.size} kişiye gönderildi`,
      });

      setShowDialog(false);
      setSelectedFriends(new Set());
    } catch (error: any) {
      console.error('Send analysis error:', error);
      toast({
        title: "Hata",
        description: error.message || "Gönderirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => setShowDialog(true)}
      >
        <MessageCircle className="w-4 h-4" />
        Mesaj Gönder
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Analizi Paylaş
            </DialogTitle>
            <DialogDescription>
              Analiz sonucunuzu arkadaşlarınıza gönderin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Henüz kimseyle mesajlaşmadınız</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.user_id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => toggleFriend(friend.user_id)}
                      >
                        <Checkbox
                          checked={selectedFriends.has(friend.user_id)}
                          onCheckedChange={() => toggleFriend(friend.user_id)}
                        />
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.profile_photo || undefined} />
                          <AvatarFallback>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {friend.full_name || friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedFriends.size} kişi seçildi
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                      disabled={sending}
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={sending || selectedFriends.size === 0}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Gönder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
