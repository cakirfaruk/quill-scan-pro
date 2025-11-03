import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImpersonate } from "@/hooks/use-impersonate";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, X, Sparkles, Send, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  has_numerology: boolean;
  has_birth_chart: boolean;
}

interface CompatibilityData {
  numerologyScore?: number;
  birthChartScore?: number;
  details?: any;
}

const Match = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityData>({});
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [showTarotDialog, setShowTarotDialog] = useState(false);
  const [tarotQuestion, setTarotQuestion] = useState("");
  const [tarotLoading, setTarotLoading] = useState(false);
  const [tarotResult, setTarotResult] = useState<any>(null);
  const [showTarotResultDialog, setShowTarotResultDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareType, setShareType] = useState<"area" | "full" | "tarot">("area");
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [specificUserId, setSpecificUserId] = useState<string | null>(null);
  const { getEffectiveUserId } = useImpersonate();

  // Tarot sample questions
  const tarotQuestions = [
    "Bu ilişkinin geleceği nasıl görünüyor?",
    "Aramızdaki bağ ne kadar güçlü?",
    "Bu kişiyle uzun vadeli bir ilişki kurabilir miyim?",
    "İlişkimizde dikkat etmem gereken noktalar neler?",
    "Bu kişi benim için doğru mu?",
    "İlişkimizin güçlü yönleri neler?",
    "Aramızdaki zorlukları nasıl aşabiliriz?",
    "Bu ilişkide mutlu olabilir miyim?",
    "Karşımdaki kişinin gerçek niyetleri neler?",
    "İlişkimiz nasıl gelişecek?",
  ];

  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      setSpecificUserId(userIdParam);
    }
    checkUser();
  }, [searchParams]);

  // Load compatibility data when profile changes
  useEffect(() => {
    const loadCompatibilityForCurrentProfile = async () => {
      if (!user || currentIndex >= profiles.length) {
        setCompatibilityData({});
        return;
      }

      const currentProfile = profiles[currentIndex];
      if (!currentProfile) {
        setCompatibilityData({});
        return;
      }

      const [user1, user2] = [user.id, currentProfile.user_id].sort();
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .maybeSingle();

      if (existingMatch && (existingMatch.compatibility_numerology || existingMatch.compatibility_birth_chart)) {
        const numerologyData = existingMatch.compatibility_numerology as any;
        const birthChartData = existingMatch.compatibility_birth_chart as any;
        
        const numerologyScore = numerologyData?.overallScore || 0;
        const birthChartScore = birthChartData?.overallScore || 0;
        
        setCompatibilityData({
          numerologyScore,
          birthChartScore,
          details: {
            overallScore: Math.round((numerologyScore + birthChartScore) / 2),
            compatibilityAreas: [
              ...(numerologyData?.compatibilityAreas || []),
              ...(birthChartData?.compatibilityAreas || [])
            ],
            numerologyAnalysis: numerologyData,
            birthChartAnalysis: birthChartData,
            matchId: existingMatch.id,
            overallSummary: numerologyData?.overallSummary || birthChartData?.overallSummary || ""
          },
        });
      } else {
        setCompatibilityData({});
      }
      
      // Check if tarot reading exists
      if (existingMatch?.tarot_reading) {
        setTarotResult(existingMatch.tarot_reading);
      } else {
        setTarotResult(null);
      }
    };

    loadCompatibilityForCurrentProfile();
  }, [currentIndex, user, profiles]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const effectiveUserId = getEffectiveUserId(user.id);
    if (!effectiveUserId) {
      navigate("/auth");
      return;
    }
    
    setUser({ ...user, id: effectiveUserId });
    
    // Get user gender
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("user_id", effectiveUserId)
      .maybeSingle();
    
    if (profile?.gender) {
      setUserGender(profile.gender);
    }
    
    await loadCredits(effectiveUserId);
    await loadProfiles(effectiveUserId);
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
      // If specificUserId is set, load only that profile
      if (specificUserId) {
        const { data: specificProfile } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, profile_photo, bio, birth_date, gender")
          .eq("user_id", specificUserId)
          .maybeSingle();

        if (!specificProfile) {
          toast({
            title: "Hata",
            description: "Kullanıcı bulunamadı",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data: photos } = await supabase
          .from("user_photos")
          .select("photo_url")
          .eq("user_id", specificProfile.user_id)
          .order("display_order");

        const { data: numData } = await supabase
          .from("numerology_analyses")
          .select("user_id, result")
          .eq("user_id", specificProfile.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: birthData } = await supabase
          .from("birth_chart_analyses")
          .select("user_id, result")
          .eq("user_id", specificProfile.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setProfiles([{
          ...specificProfile,
          photos: photos || [],
          numerology_summary: numData?.result || null,
          birth_chart_summary: birthData?.result || null,
          has_numerology: !!numData,
          has_birth_chart: !!birthData,
        }]);
        
        setLoading(false);
        return;
      }

      // Get user's gender first
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("gender")
        .eq("user_id", userId)
        .maybeSingle();

      // Get users already swiped
      const { data: swipedData } = await supabase
        .from("swipes")
        .select("target_user_id")
        .eq("user_id", userId);

      const swipedUserIds = new Set(swipedData?.map(d => d.target_user_id) || []);

      // Load all profiles (opposite gender if user has gender set)
      let query = supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo, bio, birth_date, gender")
        .neq("user_id", userId);

      // Filter by opposite gender if user has gender
      if (userProfile?.gender) {
        const oppositeGender = userProfile.gender === "male" ? "female" : "male";
        query = query.eq("gender", oppositeGender);
      }

      const { data: profilesData } = await query;

      if (!profilesData || profilesData.length === 0) {
        setLoading(false);
        return;
      }

      // Filter out already swiped users
      const availableProfiles = profilesData.filter(p => !swipedUserIds.has(p.user_id));

      if (availableProfiles.length === 0) {
        setLoading(false);
        return;
      }

      // Get numerology and birth chart data for all users
      const { data: numData } = await supabase
        .from("numerology_analyses")
        .select("user_id")
        .in("user_id", availableProfiles.map(p => p.user_id));

      const { data: birthData } = await supabase
        .from("birth_chart_analyses")
        .select("user_id")
        .in("user_id", availableProfiles.map(p => p.user_id));

      const numUserIds = new Set(numData?.map(d => d.user_id) || []);
      const birthUserIds = new Set(birthData?.map(d => d.user_id) || []);

      // Load photos and summaries for each profile
      const enrichedProfiles = await Promise.all(
        availableProfiles.map(async (profile) => {
          const { data: photos } = await supabase
            .from("user_photos")
            .select("photo_url")
            .eq("user_id", profile.user_id)
            .order("display_order");

          const has_numerology = numUserIds.has(profile.user_id);
          const has_birth_chart = birthUserIds.has(profile.user_id);

          let numerology_summary = null;
          let birth_chart_summary = null;

          if (has_numerology) {
            const { data: numAnalysis } = await supabase
              .from("numerology_analyses")
              .select("result")
              .eq("user_id", profile.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            numerology_summary = numAnalysis?.result;
          }

          if (has_birth_chart) {
            const { data: birthAnalysis } = await supabase
              .from("birth_chart_analyses")
              .select("result")
              .eq("user_id", profile.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            birth_chart_summary = birthAnalysis?.result;
          }

          return {
            ...profile,
            photos: photos || [],
            numerology_summary,
            birth_chart_summary,
            has_numerology,
            has_birth_chart,
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

  const handleCompatibilityCheck = async () => {
    if (!user || !currentProfile) return;

    setCompatibilityLoading(true);

    try {
      // First check if we already have a match with compatibility data
      const [user1, user2] = [user.id, currentProfile.user_id].sort();
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .maybeSingle();

      // If we have existing compatibility data, use it
      if (existingMatch && (existingMatch.compatibility_numerology || existingMatch.compatibility_birth_chart)) {
        const numerologyData = existingMatch.compatibility_numerology as any;
        const birthChartData = existingMatch.compatibility_birth_chart as any;
        
        const numerologyScore = numerologyData?.overallScore || 0;
        const birthChartScore = birthChartData?.overallScore || 0;
        
        setCompatibilityData({
          numerologyScore,
          birthChartScore,
          details: {
            overallScore: Math.round((numerologyScore + birthChartScore) / 2),
            compatibilityAreas: [
              ...(numerologyData?.compatibilityAreas || []),
              ...(birthChartData?.compatibilityAreas || [])
            ],
            numerologyAnalysis: numerologyData,
            birthChartAnalysis: birthChartData,
          },
        });

        toast({
          title: "Uyum Analizi",
          description: "Daha önce yapılmış uyum analizi gösteriliyor",
        });

        setCompatibilityLoading(false);
        return;
      }

      // If no existing data, check credits and create new analysis
      const creditsNeeded = 50;
      
      if (credits < creditsNeeded) {
        toast({
          title: "Yetersiz Kredi",
          description: `Bu işlem için ${creditsNeeded} kredi gerekiyor`,
          variant: "destructive",
        });
      setCompatibilityLoading(false);
        return;
      }

      setShowCompatibility(true);

      // Call compatibility analysis edge function
      const { data, error } = await supabase.functions.invoke("analyze-compatibility", {
        body: {
          analysisTypes: ["numerology", "birth_chart"],
          name1: user.user_metadata?.full_name || user.email,
          birthDate1: user.user_metadata?.birth_date,
          birthTime1: user.user_metadata?.birth_time,
          birthPlace1: user.user_metadata?.birth_place,
          name2: currentProfile.full_name || currentProfile.username,
          birthDate2: currentProfile.birth_date,
          birthTime2: "12:00",
          birthPlace2: "İstanbul",
          gender1: userGender || "male",
          gender2: currentProfile.gender || "female",
        },
      });

      if (error) throw error;

      // Calculate scores from compatibility data
      const numerologyScore = Math.round(data?.overallScore || 0);
      const birthChartScore = Math.round(data?.overallScore || 0);
      
      setCompatibilityData({
        numerologyScore,
        birthChartScore,
        details: data,
      });

      // Save compatibility data to matches table for future use
      const [matchUser1, matchUser2] = [user.id, currentProfile.user_id].sort();
      
      // Check if match exists
      const { data: matchCheck } = await supabase
        .from("matches")
        .select("id")
        .eq("user1_id", matchUser1)
        .eq("user2_id", matchUser2)
        .maybeSingle();

      if (matchCheck) {
        // Update existing match
        await supabase
          .from("matches")
          .update({
            compatibility_numerology: data,
            compatibility_birth_chart: data,
            overall_compatibility_score: Math.round(data?.overallScore || 0),
          })
          .eq("id", matchCheck.id);
      } else {
        // Create new match
        await supabase
          .from("matches")
          .insert({
            user1_id: matchUser1,
            user2_id: matchUser2,
            compatibility_numerology: data,
            compatibility_birth_chart: data,
            overall_compatibility_score: Math.round(data?.overallScore || 0),
          });
      }

      // Deduct credits
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: credits - creditsNeeded })
        .eq("user_id", user.id);

      if (creditError) throw creditError;

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditsNeeded,
        transaction_type: "compatibility_check",
        description: "Uyum detayı görüntüleme",
      });

      setCredits(credits - creditsNeeded);

      toast({
        title: "Uyum Analizi Tamamlandı",
        description: "Uyum detaylarını görüntüleyebilirsiniz",
      });
    } catch (error: any) {
      console.error("Error checking compatibility:", error);
      toast({
        title: "Hata",
        description: error.message || "Uyum analizi yapılırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setCompatibilityLoading(false);
    }
  };

  const handleTarotReading = async () => {
    if (!user || !currentProfile || !tarotQuestion.trim()) return;

    const creditsNeeded = 30;
    
    if (credits < creditsNeeded) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu işlem için ${creditsNeeded} kredi gerekiyor`,
        variant: "destructive",
      });
      return;
    }

    setTarotLoading(true);

    try {
      // Call tarot analysis
      const { data, error } = await supabase.functions.invoke("analyze-tarot", {
        body: {
          spreadType: "relationship",
          question: `${currentProfile.full_name || currentProfile.username} ile ilişkim hakkında: ${tarotQuestion}`,
          selectedCards: [],
        },
      });

      if (error) throw error;

      // Save tarot result to matches table
      const [user1, user2] = [user.id, currentProfile.user_id].sort();
      
      const { error: updateError } = await supabase
        .from("matches")
        .upsert({
          user1_id: user1,
          user2_id: user2,
          tarot_reading: data,
        }, {
          onConflict: "user1_id,user2_id"
        });

      if (updateError) throw updateError;

      setTarotResult(data);
      loadCredits(user.id);
      
      toast({
        title: "Tarot Falı Tamamlandı",
        description: "Tarot sonuçlarınızı görüntüleyebilirsiniz",
      });

      setShowTarotDialog(false);
      setTarotQuestion("");
    } catch (error: any) {
      console.error("Error performing tarot reading:", error);
      toast({
        title: "Hata",
        description: error.message || "Tarot falı yapılırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setTarotLoading(false);
    }
  };

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * tarotQuestions.length);
    setTarotQuestion(tarotQuestions[randomIndex]);
  };

  const handleShare = async () => {
    if (!user || !currentProfile) return;

    let creditsNeeded = 0;
    let shareContent = "";
    let analysisId = "";
    let analysisType = "";

    // Get compatibility analysis ID - NOT match ID
    // Compatibility analyses are stored in compatibility_analyses table
    const { data: compatibilityAnalysis } = await supabase
      .from("compatibility_analyses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const compatibilityId = compatibilityAnalysis?.id || 'temp';

    if (shareType === "area") {
      creditsNeeded = 30;
      // Include compatibility score for the area
      const areaScore = selectedArea?.compatibilityScore || 0;
      shareContent = `📊 Uyum Alanı Paylaşımı\n\n**${selectedArea?.name}** (Uyum: %${areaScore})\n\n✨ ${selectedArea?.strengths}${selectedArea?.challenges ? '\n\n⚠️ ' + selectedArea.challenges : ''}`;
      analysisType = "";
      analysisId = "";
    } else if (shareType === "full") {
      creditsNeeded = 80;
      shareContent = `📊 Tam Uyum Raporu\n\nGenel Uyum: %${compatibilityData.details?.overallScore}\n\n${compatibilityData.details?.overallSummary}\n\n[Analiz ID: ${compatibilityId}]\n[Analiz Türü: compatibility]`;
      analysisType = "compatibility";
      analysisId = compatibilityId;
    } else if (shareType === "tarot") {
      creditsNeeded = 50;
      const tarotInterpretation = tarotResult?.interpretation || {};
      const cardNames = tarotResult?.selectedCards?.map((c: any) => c.name).join(", ") || "";
      shareContent = `🔮 Tarot Falı Sonucu\n\n🃏 Kartlar: ${cardNames}\n\n${tarotInterpretation.summary || "Tarot yorumu"}\n\n[Analiz ID: ${compatibilityData.details?.matchId || 'temp'}]\n[Analiz Türü: tarot]`;
      analysisType = "tarot";
      analysisId = compatibilityData.details?.matchId || 'temp';
    }

    if (credits < creditsNeeded) {
      toast({
        title: "Yetersiz Kredi",
        description: `Bu işlem için ${creditsNeeded} kredi gerekiyor`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if there's a MUTUAL MATCH via swipes (both users liked each other)
      const { data: userLikedTarget } = await supabase
        .from("swipes")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_user_id", currentProfile.user_id)
        .eq("action", "like")
        .maybeSingle();

      const { data: targetLikedUser } = await supabase
        .from("swipes")
        .select("id")
        .eq("user_id", currentProfile.user_id)
        .eq("target_user_id", user.id)
        .eq("action", "like")
        .maybeSingle();

      // Only "match" category if BOTH users liked each other via swipes
      const messageCategory = (userLikedTarget && targetLikedUser) ? "match" : "other";

      // Send message with appropriate category
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: currentProfile.user_id,
          content: shareContent,
          message_category: messageCategory,
        });

      if (messageError) throw messageError;

      // Deduct credits
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: credits - creditsNeeded })
        .eq("user_id", user.id);

      if (creditError) throw creditError;

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditsNeeded,
        transaction_type: "share_analysis",
        description: shareType === "area" ? "Uyum alanı paylaşımı" : shareType === "full" ? "Tam uyum raporu paylaşımı" : "Tarot sonucu paylaşımı",
      });

      setCredits(credits - creditsNeeded);

      toast({
        title: "Paylaşıldı",
        description: `${currentProfile.full_name || currentProfile.username} ile paylaşıldı`,
      });

      setShowShareDialog(false);
    } catch (error: any) {
      console.error("Error sharing:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılırken bir hata oluştu",
        variant: "destructive",
      });
    }
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
              {currentProfile.has_numerology ? (
                <Badge variant="outline" className="mr-2">
                  Numeroloji ✓
                </Badge>
              ) : (
                <Badge variant="secondary" className="mr-2">
                  Numeroloji Yok
                </Badge>
              )}
              {currentProfile.has_birth_chart ? (
                <Badge variant="outline">
                  Doğum Haritası ✓
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Doğum Haritası Yok
                </Badge>
              )}
            </div>

            {!currentProfile.has_numerology && !currentProfile.has_birth_chart ? (
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  Uyum Belirlenemedi
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {currentProfile.has_numerology && compatibilityData.numerologyScore !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Numerolojik Uyum</span>
                    <span className="text-lg font-bold text-primary">
                      %{compatibilityData.numerologyScore}
                    </span>
                  </div>
                )}
                {currentProfile.has_birth_chart && compatibilityData.birthChartScore !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Astrolojik Uyum</span>
                    <span className="text-lg font-bold text-primary">
                      %{compatibilityData.birthChartScore}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowCompatibility(true);
                  if (!compatibilityData.details) {
                    handleCompatibilityCheck();
                  }
                }}
                disabled={compatibilityLoading || (!currentProfile.has_numerology && !currentProfile.has_birth_chart)}
              >
                {compatibilityLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Uyum Detayını Gör (50 Kredi)
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTarotDialog(true)}
                disabled={!!tarotResult}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {tarotResult ? "Tarot Bakıldı ✓" : "Tarot Baktır"}
              </Button>
            </div>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uyum Detayları</DialogTitle>
            <DialogDescription>
              {currentProfile?.full_name || currentProfile?.username} ile uyum analiziniz
            </DialogDescription>
          </DialogHeader>
          
          {compatibilityLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Heart className="w-16 h-16 text-primary/30" />
                </div>
                <Heart className="w-16 h-16 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold animate-pulse">Uyum Analizi Yapılıyor...</p>
                <p className="text-sm text-muted-foreground">
                  Yıldızlar hizalanıyor ve uyumunuz hesaplanıyor ✨
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : compatibilityData.details ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-4xl font-bold text-primary mb-2">
                  %{compatibilityData.details.overallScore}
                </p>
                <p className="text-sm text-muted-foreground">Genel Uyum Oranı</p>
              </div>

              <Separator />

              {compatibilityData.details.compatibilityAreas?.map((area: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{area.name}</h3>
                    <Badge variant="secondary">%{area.compatibilityScore}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{area.strengths}</p>
                  {area.challenges && (
                    <p className="text-sm text-destructive mb-2">{area.challenges}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedArea(area);
                        setShareType("area");
                        setShowShareDialog(true);
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Paylaş (30₺)
                    </Button>
                  </div>
                </Card>
              ))}

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Genel Özet</h3>
                <p className="text-sm">{compatibilityData.details.overallSummary}</p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setShareType("full");
                  setShowShareDialog(true);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Tüm Raporu Paylaş (80 Kredi)
              </Button>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Uyum detaylarını görmek için 50 kredi gerekiyor</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTarotDialog} onOpenChange={setShowTarotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarot Falı</DialogTitle>
            <DialogDescription>
              {currentProfile?.full_name || currentProfile?.username} ile ilişkiniz hakkında tarot falı baktırın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Soru</Label>
              <Textarea
                placeholder="İlişki hakkında sormak istediğiniz soruyu yazın..."
                value={tarotQuestion}
                onChange={(e) => setTarotQuestion(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getRandomQuestion}
                  className="flex-1"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Rastgele Seç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getRandomQuestion}
                  className="flex-1"
                  disabled={!tarotQuestion}
                >
                  Değiştir
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleTarotReading}
                disabled={tarotLoading || !tarotQuestion.trim() || !!tarotResult}
              >
                {tarotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yorumlanıyor...
                  </>
                ) : tarotResult ? (
                  "Tarot Bakıldı ✓"
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tarota Bak (30 Kredi)
                  </>
                )}
              </Button>
            </div>

            {tarotResult && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowTarotResultDialog(true)}
                >
                  Sonucu Gör
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShareType("tarot");
                    setShowShareDialog(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Paylaş (50₺)
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {tarotResult ? "Tarot sonucunu görüntüleyebilir veya paylaşabilirsiniz" : "Her kullanıcı ile bir kez tarot bakılabilir"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paylaş</DialogTitle>
            <DialogDescription>
              {shareType === "area" && "Seçilen alanı paylaş (30 kredi)"}
              {shareType === "full" && "Tüm raporu paylaş (80 kredi)"}
              {shareType === "tarot" && "Tarot sonucunu paylaş (50 kredi)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bu içeriği {currentProfile?.full_name || currentProfile?.username} ile paylaşmak istediğinizden emin misiniz?
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowShareDialog(false)} className="flex-1">
                İptal
              </Button>
              <Button onClick={handleShare} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Paylaş
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tarot Result Dialog */}
      <Dialog open={showTarotResultDialog} onOpenChange={setShowTarotResultDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔮 Tarot Falı Sonucu</DialogTitle>
            <DialogDescription>
              {currentProfile?.full_name || currentProfile?.username} ile ilişkiniz hakkında tarot yorumu
            </DialogDescription>
          </DialogHeader>

          {tarotResult && (
            <div className="space-y-4">
              {tarotResult.selectedCards && tarotResult.selectedCards.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🃏 Seçilen Kartlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {tarotResult.selectedCards.map((card: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {card.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {tarotResult.interpretation && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">📖 Genel Yorum</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {tarotResult.interpretation.summary || tarotResult.interpretation}
                    </p>
                  </div>

                  {tarotResult.interpretation.cardInterpretations && (
                    <div>
                      <h4 className="font-semibold mb-2">🎴 Kart Yorumları</h4>
                      <div className="space-y-2">
                        {tarotResult.interpretation.cardInterpretations.map((interp: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg bg-muted/50">
                            <p className="font-medium text-sm mb-1">{interp.card}</p>
                            <p className="text-xs text-muted-foreground">{interp.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowTarotResultDialog(false)}
                >
                  Kapat
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowTarotResultDialog(false);
                    setShareType("tarot");
                    setShowShareDialog(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Paylaş (50₺)
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
