import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Star, Search, Plus, X, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface CloseFriendsManagerProps {
  userId: string;
}

export const CloseFriendsManager = ({ userId }: CloseFriendsManagerProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [closeFriends, setCloseFriends] = useState<Friend[]>([]);
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load close friends
      const { data: closeData } = await supabase
        .from("close_friends")
        .select("friend_id")
        .eq("user_id", userId);

      const closeFriendIds = closeData?.map((cf) => cf.friend_id) || [];

      // Load all accepted friends
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          friend_id,
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .eq("user_id", userId)
        .eq("status", "accepted");

      const friends: Friend[] = (friendsData || []).map((f: any) => ({
        user_id: f.friend_profile.user_id,
        username: f.friend_profile.username,
        full_name: f.friend_profile.full_name,
        profile_photo: f.friend_profile.profile_photo,
      }));

      setAllFriends(friends);
      setCloseFriends(friends.filter((f) => closeFriendIds.includes(f.user_id)));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCloseFriend = async (friend: Friend) => {
    try {
      const { error } = await supabase.from("close_friends").insert({
        user_id: userId,
        friend_id: friend.user_id,
      });

      if (error) throw error;

      setCloseFriends([...closeFriends, friend]);
      toast({
        title: "Yakın Arkadaş Eklendi",
        description: `${friend.full_name || friend.username} yakın arkadaşlarınıza eklendi.`,
      });
    } catch (error) {
      console.error("Error adding close friend:", error);
      toast({
        title: "Hata",
        description: "Eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const removeCloseFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("close_friends")
        .delete()
        .eq("user_id", userId)
        .eq("friend_id", friendId);

      if (error) throw error;

      setCloseFriends(closeFriends.filter((f) => f.user_id !== friendId));
      toast({
        title: "Yakın Arkadaş Çıkarıldı",
        description: "Arkadaş yakın arkadaşlar listesinden çıkarıldı.",
      });
    } catch (error) {
      console.error("Error removing close friend:", error);
      toast({
        title: "Hata",
        description: "Çıkarılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredFriends = allFriends.filter(
    (f) =>
      !closeFriends.some((cf) => cf.user_id === f.user_id) &&
      (f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Star className="w-4 h-4 text-yellow-500" />
        Yakın Arkadaşlar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Yakın Arkadaşlar
          </DialogTitle>
          <DialogDescription>
            Yakın arkadaşlarınız özel hikayelerinizi görebilir
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Close Friends */}
            {closeFriends.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Yakın Arkadaşlarınız ({closeFriends.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {closeFriends.map((friend) => (
                      <motion.div
                        key={friend.user_id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full pl-1 pr-2 py-1"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={friend.profile_photo || undefined} />
                          <AvatarFallback className="text-xs">
                            {friend.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{friend.full_name || friend.username}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full hover:bg-destructive/20"
                          onClick={() => removeCloseFriend(friend.user_id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Search & Add */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Arkadaş Ekle</h4>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Arkadaş ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[200px]">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                      ? "Sonuç bulunamadı"
                      : "Tüm arkadaşlarınız zaten yakın arkadaş"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.user_id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.profile_photo || undefined} />
                            <AvatarFallback>
                              {friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {friend.full_name || friend.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{friend.username}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addCloseFriend(friend)}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Ekle
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};
