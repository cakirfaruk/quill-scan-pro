import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Post, Friend } from "@/types/feed";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post | null;
    currentUserId: string;
    onShare: () => void;
}

export const ShareDialog = ({
    open,
    onOpenChange,
    post,
    currentUserId,
    onShare
}: ShareDialogProps) => {
    const { toast } = useToast();
    const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (open) {
            loadFriends();
            setSelectedFriends(new Set());
            setSearchQuery("");
        }
    }, [open]);

    const loadFriends = async () => {
        try {
            setLoading(true);
            const { data: friendsData, error } = await supabase
                .from("friends")
                .select(`
          user_id,
          friend_id,
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
                .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
                .eq("status", "accepted");

            if (error) throw error;

            if (friendsData) {
                const friendsList: Friend[] = friendsData.map((f: any) => {
                    const isSender = f.user_id === currentUserId;
                    const profile = isSender ? f.friend_profile : f.user_profile;
                    return {
                        user_id: profile.user_id,
                        username: profile.username,
                        full_name: profile.full_name,
                        profile_photo: profile.profile_photo,
                    };
                });
                setFriends(friendsList);
            }
        } catch (error) {
            console.error("Error loading friends:", error);
            toast({ title: "Hata", description: "Arkadaş listesi yüklenemedi", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleShareToFriends = async () => {
        if (!post || selectedFriends.size === 0) return;

        try {
            setSending(true);
            const messageContent = `📸 ${post.profile.full_name || post.profile.username} adlı kişinin paylaşımı`;

            const messagesToInsert = Array.from(selectedFriends).map(friendId => ({
                sender_id: currentUserId,
                receiver_id: friendId,
                content: messageContent,
                message_category: "friend"
            }));

            await supabase.from("messages").insert(messagesToInsert);

            await supabase.from("posts")
                .update({ shares_count: (post.shares_count || 0) + selectedFriends.size })
                .eq("id", post.id);

            toast({ title: "Başarılı", description: "Paylaşıldı" });
            onShare();
            onOpenChange(false);
        } catch (e) {
            toast({ title: "Hata", description: "Paylaşım yapılamadı", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const toggleFriendSelection = (id: string) => {
        const s = new Set(selectedFriends);
        if (s.has(id)) s.delete(id);
        else s.add(id);
        setSelectedFriends(s);
    };

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Paylaş</DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Arkadaş ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-muted/50 border-white/10"
                        />
                    </div>

                    <div className="border rounded-lg p-2 min-h-[200px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <LoadingSpinner />
                            </div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                                {friends.length === 0 ? "Listenizde arkadaş bulunmuyor" : "Sonuç bulunamadı"}
                            </div>
                        ) : (
                            <ScrollArea className="h-48">
                                <div className="space-y-1">
                                    {filteredFriends.map((friend) => (
                                        <div
                                            key={friend.user_id}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedFriends.has(friend.user_id) ? 'bg-primary/20' : 'hover:bg-muted'}`}
                                            onClick={() => toggleFriendSelection(friend.user_id)}
                                        >
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={friend.profile_photo || undefined} />
                                                <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-medium truncate">{friend.full_name || friend.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                                            </div>
                                            {selectedFriends.has(friend.user_id) && (
                                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground text-right">
                        {selectedFriends.size} kişi seçildi
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>İptal</Button>
                    <Button onClick={handleShareToFriends} disabled={selectedFriends.size === 0 || sending}>
                        {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Gönder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
