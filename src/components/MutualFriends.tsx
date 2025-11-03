import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface MutualFriend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface MutualFriendsProps {
  userId: string;
  profileUserId: string;
}

export const MutualFriends = ({ userId, profileUserId }: MutualFriendsProps) => {
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMutualFriends();
  }, [userId, profileUserId]);

  const loadMutualFriends = async () => {
    if (!userId || !profileUserId || userId === profileUserId) {
      setLoading(false);
      return;
    }

    try {
      // Get user's friends
      const { data: userFriends } = await supabase
        .from("friends")
        .select("user_id, friend_id")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      if (!userFriends || userFriends.length === 0) {
        setLoading(false);
        return;
      }

      const userFriendIds = userFriends.map(f =>
        f.user_id === userId ? f.friend_id : f.user_id
      );

      // Get profile user's friends
      const { data: profileFriends } = await supabase
        .from("friends")
        .select("user_id, friend_id")
        .or(`user_id.eq.${profileUserId},friend_id.eq.${profileUserId}`)
        .eq("status", "accepted");

      if (!profileFriends || profileFriends.length === 0) {
        setLoading(false);
        return;
      }

      const profileFriendIds = profileFriends.map(f =>
        f.user_id === profileUserId ? f.friend_id : f.user_id
      );

      // Find mutual friends
      const mutualIds = userFriendIds.filter(id => profileFriendIds.includes(id));

      if (mutualIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get profiles of mutual friends
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", mutualIds);

      setMutualFriends(profiles || []);
    } catch (error) {
      console.error("Error loading mutual friends:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || mutualFriends.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium">
          {mutualFriends.length} Ortak Arkadaş
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {mutualFriends.slice(0, 6).map((friend) => (
          <Avatar
            key={friend.user_id}
            className="w-10 h-10 border-2 border-background hover:scale-110 transition-transform cursor-pointer"
            title={friend.full_name || friend.username}
          >
            <AvatarImage src={friend.profile_photo || undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
              {friend.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {mutualFriends.length > 6 && (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
            +{mutualFriends.length - 6}
          </div>
        )}
      </div>
    </div>
  );
};
