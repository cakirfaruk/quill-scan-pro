import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
}

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    content: string;
    sender_id: string;
  } | null;
  currentUserId: string;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  message,
  currentUserId,
}: ForwardMessageDialogProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFriends();
      setSelectedFriends(new Set());
      setSearchQuery("");
    }
  }, [open]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      // Get all friends
      const { data: friendships, error } = await supabase
        .from("friends")
        .select("user_id, friend_id")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq("status", "accepted");

      if (error) throw error;

      // Extract friend IDs
      const friendIds = friendships?.map((f) =>
        f.user_id === currentUserId ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      setFriends(profiles || []);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast({
        title: "Hata",
        description: "Arkadaş listesi yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleForward = async () => {
    if (!message || selectedFriends.size === 0) return;

    setIsSending(true);
    try {
      const forwardedContent = message.content;
      
      // Send to all selected friends
      const insertPromises = Array.from(selectedFriends).map((friendId) =>
        supabase.from("messages").insert({
          sender_id: currentUserId,
          receiver_id: friendId,
          content: forwardedContent,
          forwarded_from: message.id,
          message_category: "friend",
        })
      );

      const results = await Promise.all(insertPromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error("Bazı mesajlar gönderilemedi");
      }

      toast({
        title: "Başarılı",
        description: `Mesaj ${selectedFriends.size} kişiye iletildi`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast({
        title: "Hata",
        description: "Mesaj iletilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mesajı İlet</DialogTitle>
          <DialogDescription>
            Mesajı iletmek istediğiniz kişileri seçin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Arkadaş ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          {selectedFriends.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedFriends.size} kişi seçildi
              </Badge>
            </div>
          )}

          {/* Friends list */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Arkadaş bulunamadı" : "Henüz arkadaşınız yok"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleFriend(friend.user_id)}
                  >
                    <Checkbox
                      checked={selectedFriends.has(friend.user_id)}
                      onCheckedChange={() => toggleFriend(friend.user_id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.profile_photo} />
                      <AvatarFallback>
                        {friend.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={handleForward}
              disabled={selectedFriends.size === 0 || isSending}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  İlet ({selectedFriends.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
