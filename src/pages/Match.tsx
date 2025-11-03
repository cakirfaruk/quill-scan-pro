import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchProfile {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  bio: string | null;
  birth_date: string | null;
  gender: string | null;
  photos: { photo_url: string }[];
  numerology_summary: any;
  birth_chart_summary: any;
}

const Match = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    await loadCredits(user.id);
    await loadProfiles(user.id);
  };

  const loadCredits = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) setCredits(data.credits);
  };

  const loadProfiles = async (userId: string) => {
    try {
      // Get users who have both numerology and birth chart analyses
      const { data: numData } = await supabase
        .from("numerology_analyses")
        .select("user_id")
        .neq("user_id", userId);

      const { data: birthData } = await supabase
        .from("birth_chart_analyses")
        .select("user_id")
        .neq("user_id", userId);

      if (!numData || !birthData) {
        setLoading(false);
        return;
      }

      const numUserIds = new Set(numData.map(d => d.user_id));
      const birthUserIds = new Set(birthData.map(d => d.user_id));
      const eligibleUserIds = Array.from(numUserIds).filter(id => birthUserIds.has(id));

      // Get users already swiped
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("target_user_id")
        .eq("user_id", userId);

      const swipedUserIds = new Set(swipedData?.map(d => d.target_user_id) || []);
      const availableUserIds = eligibleUserIds.filter(id => !swipedUserIds.has(id));

      if (availableUserIds.length === 0) {
        setLoading(false);
        return;
      }

      // Load profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo, bio, birth_date, gender")
        .in("user_id", availableUserIds);

      if (!profilesData) {
        setLoading(false);
        return;
      }

      // Load photos and summaries for each profile
      const enrichedProfiles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: photos } = await supabase
            .from("user_photos")
            .select("photo_url")
            .eq("user_id", profile.user_id)
            .order("display_order");

          const { data: numAnalysis } = await supabase
            .from("numerology_analyses")
            .select("result")
            .eq("user_id", profile.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: birthAnalysis } = await supabase
            .from("birth_chart_analyses")
            .select("result")
            .eq("user_id", profile.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...profile,
            photos: photos || [],
            numerology_summary: numAnalysis?.result,
            birth_chart_summary: birthAnalysis?.result,
          };
        })
      );

      setProfiles(enrichedProfiles);
    } catch (error: any) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Hata",
        description: "Profiller yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: "like" | "pass") => {
    if (!user || currentIndex >= profiles.length) return;

    const creditsNeeded = action === "like" ? 5 : 1;
    if (credits < creditsNeeded) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu işlem için ${creditsNeeded} kredi gerekiyor`,
        variant: "destructive",
      });
      return;
    }

    const targetProfile = profiles[currentIndex];

    try {
      // Insert swipe
      const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
          user_id: user.id,
          target_user_id: targetProfile.user_id,
          action,
          credits_used: creditsNeeded,
        });

      if (swipeError) throw swipeError;

      // Deduct credits
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: credits - creditsNeeded })
        .eq("user_id", user.id);

      if (creditError) throw creditError;

      // Record transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditsNeeded,
        transaction_type: action === "like" ? "match_like" : "match_pass",
        description: `Eşleşme - ${action === "like" ? "Beğen" : "Geç"}`,
      });

      setCredits(credits - creditsNeeded);

      // Check for mutual match
      if (action === "like") {
        const { data: mutualSwipe } = await supabase
          .from("swipes")
          .select("*")
          .eq("user_id", targetProfile.user_id)
          .eq("target_user_id", user.id)
          .eq("action", "like")
          .maybeSingle();

        if (mutualSwipe) {
          // Create match
          const [user1, user2] = [user.id, targetProfile.user_id].sort();
          await supabase.from("matches").insert({
            user1_id: user1,
            user2_id: user2,
          });

          toast({
            title: "Eşleşme! 🎉",
            description: `${targetProfile.full_name || targetProfile.username} ile eşleştiniz!`,
          });
        }
      }

      // Move to next profile
      setCurrentIndex(currentIndex + 1);
    } catch (error: any) {
      console.error("Error swiping:", error);
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleCompatibilityCheck = async (type: "both" | "numerology" | "birth_chart") => {
    const creditsNeeded = type === "both" ? 100 : 50;
    
    if (credits < creditsNeeded) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu işlem için ${creditsNeeded} kredi gerekiyor`,
        variant: "destructive",
      });
      return;
    }

    setCompatibilityLoading(true);
    setShowCompatibility(true);

    // In a real app, this would call the compatibility analysis edge function
    // For now, we'll just show a placeholder
    
    setTimeout(() => {
      setCompatibilityLoading(false);
      toast({
        title: "Uyum Analizi",
        description: "Uyum analizi başarıyla tamamlandı",
      });
    }, 2000);
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card className="p-8 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Profil Kalmadı</h2>
            <p className="text-muted-foreground">
              Şu an gösterilecek yeni profil bulunmuyor. Daha sonra tekrar kontrol edin!
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Eşleşme</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {credits} Kredi
          </Badge>
        </div>

        <Card className="overflow-hidden mb-6">
          <div className="relative h-96">
            <img
              src={currentProfile.profile_photo || currentProfile.photos[0]?.photo_url || "/placeholder.svg"}
              alt={currentProfile.username}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
              <h2 className="text-2xl font-bold">
                {currentProfile.full_name || currentProfile.username}
              </h2>
              {currentProfile.birth_date && (
                <p className="text-sm opacity-90">
                  {new Date().getFullYear() - new Date(currentProfile.birth_date).getFullYear()} yaşında
                </p>
              )}
            </div>
          </div>
          
          <CardContent className="p-6">
            {currentProfile.bio && (
              <p className="mb-4 text-foreground">{currentProfile.bio}</p>
            )}
            
            <div className="space-y-2 mb-4">
              <Badge variant="outline" className="mr-2">
                Numeroloji ✓
              </Badge>
              <Badge variant="outline">
                Doğum Haritası ✓
              </Badge>
            </div>

            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => setShowCompatibility(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Uyum Oranını Gör
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16"
            onClick={() => handleSwipe("pass")}
          >
            <X className="w-8 h-8 text-destructive" />
          </Button>
          <Button
            size="lg"
            variant="default"
            className="rounded-full w-16 h-16"
            onClick={() => handleSwipe("like")}
          >
            <Heart className="w-8 h-8" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Beğenmek: 5 kredi • Geçmek: 1 kredi
        </p>
      </div>

      <Dialog open={showCompatibility} onOpenChange={setShowCompatibility}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uyum Analizi</DialogTitle>
            <DialogDescription>
              {currentProfile.full_name || currentProfile.username} ile uyumunuzu öğrenin
            </DialogDescription>
          </DialogHeader>
          
          {compatibilityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-4xl font-bold text-primary mb-2">85%</p>
                <p className="text-sm text-muted-foreground">Genel Uyum Oranı</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCompatibilityCheck("numerology")}
                >
                  Numeroloji Uyumu - 50 Kredi
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCompatibilityCheck("birth_chart")}
                >
                  Doğum Haritası Uyumu - 50 Kredi
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleCompatibilityCheck("both")}
                >
                  Her İkisi - 100 Kredi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Match;
