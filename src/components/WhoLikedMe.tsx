import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Lock, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface LikedProfile {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  created_at: string;
  action: string;
}

export const WhoLikedMe = () => {
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadLikes();
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) setCredits(data.credits);
  };

  const loadLikes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get users who liked current user
      const { data: swipesData, error } = await supabase
        .from("swipes")
        .select(`
          target_user_id,
          created_at,
          action,
          profiles!swipes_user_id_fkey(
            user_id,
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("target_user_id", user.id)
        .in("action", ["like", "super_like"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const likes = (swipesData || []).map((swipe: any) => ({
        ...swipe.profiles,
        created_at: swipe.created_at,
        action: swipe.action,
      }));

      setLikedProfiles(likes);
    } catch (error) {
      console.error("Error loading likes:", error);
      toast({
        title: "Hata",
        description: "Beğeniler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = async () => {
    const creditsNeeded = 20;
    
    if (credits < creditsNeeded) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu özellik için ${creditsNeeded} kredi gerekiyor.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: deductResult, error } = await supabase.rpc(
        "deduct_credits_atomic" as any,
        {
          p_user_id: user.id,
          p_amount: creditsNeeded,
          p_transaction_type: "who_liked_me",
          p_description: "Seni Beğenenler - Premium Özellik",
        }
      );

      if (error || typeof deductResult !== 'number') throw new Error("Kredi düşürme başarısız");

      setCredits(deductResult);
      setIsRevealed(true);
      
      toast({
        title: "Premium Özellik Aktif",
        description: "Seni beğenenleri görüntülüyorsun!",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (likedProfiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Henüz kimse seni beğenmedi
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Seni Beğenenler
          <Badge variant="secondary">{likedProfiles.length}</Badge>
        </CardTitle>
        {!isRevealed && (
          <Button onClick={handleReveal} variant="default" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Görüntüle (20 Kredi)
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {likedProfiles.map((profile) => (
            <div
              key={profile.user_id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              {!isRevealed ? (
                <>
                  <div className="relative">
                    <Avatar className="w-12 h-12 blur-lg">
                      <AvatarImage src={profile.profile_photo || undefined} />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <Lock className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium blur-sm">████████</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.action === "super_like" ? "Super Like ⚡" : "Beğendi 💕"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar
                    className="w-12 h-12 cursor-pointer"
                    onClick={() => navigate(`/profile/${profile.username}`)}
                  >
                    <AvatarImage src={profile.profile_photo || undefined} />
                    <AvatarFallback>
                      {profile.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p 
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${profile.username}`)}
                    >
                      {profile.full_name || profile.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.action === "super_like" ? "Super Like ⚡" : "Beğendi 💕"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/match?userId=${profile.user_id}`)}
                  >
                    Görüntüle
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
