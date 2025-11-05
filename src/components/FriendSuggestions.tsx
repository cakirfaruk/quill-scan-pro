import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

interface FriendSuggestion {
  id: string;
  suggested_user_id: string;
  compatibility_score: number;
  common_interests: string[];
  reason: string;
  profiles?: {
    username: string;
    avatar_url?: string | null;
    profile_photo?: string | null;
  };
}

export const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("friend_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .order("compatibility_score", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(s => s.suggested_user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, profile_photo")
          .in("user_id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const enrichedData = data.map(suggestion => ({
          ...suggestion,
          profiles: profilesMap.get(suggestion.suggested_user_id) || {
            username: "Bilinmeyen Kullanıcı",
            avatar_url: null,
          },
        }));

        setSuggestions(enrichedData);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("generate-friend-suggestions", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Öneriler Güncellendi",
        description: `${data.count} yeni arkadaş önerisi bulundu`,
      });

      await loadSuggestions();
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Hata",
        description: "Öneriler oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "İstek Gönderildi",
        description: "Arkadaşlık isteği başarıyla gönderildi",
      });

      dismissSuggestion(targetUserId);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği gönderilemedi",
        variant: "destructive",
      });
    }
  };

  const dismissSuggestion = async (targetUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("friend_suggestions")
        .update({ dismissed: true })
        .eq("user_id", user.id)
        .eq("suggested_user_id", targetUserId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.suggested_user_id !== targetUserId));
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Arkadaş Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border animate-fade-in">
              <EnhancedSkeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <EnhancedSkeleton variant="text" width="60%" />
                <EnhancedSkeleton variant="text" width="80%" />
                <EnhancedSkeleton variant="rectangular" height={4} />
                <div className="flex gap-2">
                  <EnhancedSkeleton variant="rounded" width={100} height={32} />
                  <EnhancedSkeleton variant="rounded" width={32} height={32} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Arkadaş Önerileri
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateSuggestions}
          disabled={generating}
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Henüz öneri bulunamadı
            </p>
            <Button onClick={generateSuggestions} disabled={generating}>
              Öneri Oluştur
            </Button>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={suggestion.profiles?.profile_photo || suggestion.profiles?.avatar_url || undefined} />
                <AvatarFallback>
                  {suggestion.profiles?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {suggestion.profiles?.username || "Bilinmeyen Kullanıcı"}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    %{suggestion.compatibility_score}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {suggestion.reason}
                </p>

                {suggestion.common_interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {suggestion.common_interests.slice(0, 3).map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}

                <Progress value={suggestion.compatibility_score} className="h-1 mb-2" />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(suggestion.suggested_user_id)}
                    className="flex-1"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Arkadaş Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissSuggestion(suggestion.suggested_user_id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};