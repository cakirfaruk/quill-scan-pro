import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCardGestures } from "@/hooks/use-gestures";
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
import { SkeletonCard } from "@/components/ui/enhanced-skeleton";

// Import tarot card images
import cardBackImg from "@/assets/tarot/card-back.png";
import deliImg from "@/assets/tarot/deli.png";
import buyucuImg from "@/assets/tarot/buyucu.png";
import basRahibeImg from "@/assets/tarot/bas-rahibe-azize.png";
import imparatoriceImg from "@/assets/tarot/imparatorice.png";
import imparatorImg from "@/assets/tarot/imparator.png";
import basRahipImg from "@/assets/tarot/bas-rahip-aziz.png";
import asiklarImg from "@/assets/tarot/asiklar.png";
import savaşArabasiImg from "@/assets/tarot/savas-arabasi.png";
import gucImg from "@/assets/tarot/guc.png";
import ermisImg from "@/assets/tarot/ermis.png";
import kaderCarkiImg from "@/assets/tarot/kader-carki.png";
import adaletImg from "@/assets/tarot/adalet.png";
import asilanAdamImg from "@/assets/tarot/asilan-adam.png";
import olumImg from "@/assets/tarot/olum.png";
import dengeImg from "@/assets/tarot/denge.png";
import seytanImg from "@/assets/tarot/seytan.png";
import yikilanKuleImg from "@/assets/tarot/yikilan-kule.png";
import yildizImg from "@/assets/tarot/yildiz.png";
import ayImg from "@/assets/tarot/ay.png";
import gunesImg from "@/assets/tarot/gunes.png";
import mahkemeImg from "@/assets/tarot/mahkeme.png";
import dunyaImg from "@/assets/tarot/dunya.png";

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
  const [selectedTarotCards, setSelectedTarotCards] = useState<any[]>([]);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareType, setShareType] = useState<"area" | "full" | "tarot">("area");
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [specificUserId, setSpecificUserId] = useState<string | null>(null);

  // Card swipe gestures for mobile
  const cardGestures = useCardGestures({
    onSwipeLeft: () => handleSwipe("pass"),
    onSwipeRight: () => handleSwipe("like"),
    threshold: 100,
  });

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

  // 22 Major Arcana cards with images
  const majorArcana = [
    { id: 0, name: "Deli", suit: "Major Arcana", image: deliImg },
    { id: 1, name: "Büyücü", suit: "Major Arcana", image: buyucuImg },
    { id: 2, name: "Baş Rahibe", suit: "Major Arcana", image: basRahibeImg },
    { id: 3, name: "İmparatoriçe", suit: "Major Arcana", image: imparatoriceImg },
    { id: 4, name: "İmparator", suit: "Major Arcana", image: imparatorImg },
    { id: 5, name: "Baş Rahip", suit: "Major Arcana", image: basRahipImg },
    { id: 6, name: "Aşıklar", suit: "Major Arcana", image: asiklarImg },
    { id: 7, name: "Savaş Arabası", suit: "Major Arcana", image: savaşArabasiImg },
    { id: 8, name: "Güç", suit: "Major Arcana", image: gucImg },
    { id: 9, name: "Ermiş", suit: "Major Arcana", image: ermisImg },
    { id: 10, name: "Kader Çarkı", suit: "Major Arcana", image: kaderCarkiImg },
    { id: 11, name: "Adalet", suit: "Major Arcana", image: adaletImg },
    { id: 12, name: "Asılan Adam", suit: "Major Arcana", image: asilanAdamImg },
    { id: 13, name: "Ölüm", suit: "Major Arcana", image: olumImg },
    { id: 14, name: "Denge", suit: "Major Arcana", image: dengeImg },
    { id: 15, name: "Şeytan", suit: "Major Arcana", image: seytanImg },
    { id: 16, name: "Yıkılan Kule", suit: "Major Arcana", image: yikilanKuleImg },
    { id: 17, name: "Yıldız", suit: "Major Arcana", image: yildizImg },
    { id: 18, name: "Ay", suit: "Major Arcana", image: ayImg },
    { id: 19, name: "Güneş", suit: "Major Arcana", image: gunesImg },
    { id: 20, name: "Mahkeme", suit: "Major Arcana", image: mahkemeImg },
    { id: 21, name: "Dünya", suit: "Major Arcana", image: dunyaImg },
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
    
    setUser(user);
    
    // Get user gender
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profile?.gender) {
      setUserGender(profile.gender);
    }
    
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
        .neq("user_id", userId)
        .eq("show_in_matches", true);

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

      // **PARALEL SORGULAR** - Tüm profil verilerini paralel yükle
      const enrichedProfiles = await Promise.all(
        availableProfiles.map(async (profile) => {
          const [photosResult, numResult, birthResult] = await Promise.all([
            supabase
              .from("user_photos")
              .select("photo_url")
              .eq("user_id", profile.user_id)
              .order("display_order"),
            
            supabase
              .from("numerology_analyses")
              .select("result")
              .eq("user_id", profile.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            
            supabase
              .from("birth_chart_analyses")
              .select("result")
              .eq("user_id", profile.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          ]);

          return {
            ...profile,
            photos: photosResult.data || [],
            numerology_summary: numResult.data?.result || null,
            birth_chart_summary: birthResult.data?.result || null,
            has_numerology: !!numResult.data,
            has_birth_chart: !!birthResult.data,
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

    if (selectedTarotCards.length !== 3) {
      toast({
        title: "Kart Seçimi",
        description: "Lütfen 3 kart seçin",
        variant: "destructive",
      });
      return;
    }

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
          selectedCards: selectedTarotCards,
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
          tarot_reading: {
            ...data,
            selectedCards: selectedTarotCards,
            question: tarotQuestion
          },
        }, {
          onConflict: "user1_id,user2_id"
        });

      if (updateError) throw updateError;

      setTarotResult({
        ...data,
        selectedCards: selectedTarotCards,
        question: tarotQuestion
      });
      loadCredits(user.id);
      
      toast({
        title: "Tarot Falı Tamamlandı",
        description: "Tarot sonuçlarınızı görüntüleyebilirsiniz",
      });

      setShowTarotDialog(false);
      setShowCardSelection(false);
      setSelectedTarotCards([]);
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

  const toggleCardSelection = (card: any) => {
    setSelectedTarotCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maksimum Seçim",
          description: "En fazla 3 kart seçebilirsiniz",
        });
        return prev;
      }
      return [...prev, { ...card, isReversed: false }];
    });
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
          <div className="space-y-4 animate-fade-in">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card className="p-8 text-center card-hover animate-scale-in">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse-glow" />
            <h2 className="text-2xl font-bold mb-2 gradient-text">Profil Kalmadı</h2>
            <p className="text-muted-foreground animate-fade-in">
              Şu an gösterilecek yeni profil bulunmuyor. Daha sonra tekrar kontrol edin!
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex flex-col px-4 pt-2 pb-2 md:py-8 max-w-md mx-auto w-full">
        <div 
          className="flex-1 overflow-hidden card-hover animate-scale-in shadow-elegant relative select-none touch-none"
          {...cardGestures}
          style={{
            transform: `translateX(${cardGestures.offset.x}px) translateY(${cardGestures.offset.y}px) rotate(${cardGestures.rotation}deg)`,
            transition: cardGestures.isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <Card className="overflow-hidden h-full flex flex-col">
            <div className="relative flex-1">
              <img
                src={currentProfile.profile_photo || currentProfile.photos[0]?.photo_url || "/placeholder.svg"}
                alt={currentProfile.username}
                className="w-full h-full object-cover transition-transform duration-500 pointer-events-none"
              />
              
              {/* Swipe indicators */}
              {cardGestures.offset.x > 50 && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-fade-in">
                  <div className="bg-green-500 text-white px-8 py-4 rounded-full font-bold text-2xl rotate-12 shadow-glow">
                    <Heart className="w-16 h-16" />
                  </div>
                </div>
              )}
              {cardGestures.offset.x < -50 && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center animate-fade-in">
                  <div className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-2xl -rotate-12 shadow-glow">
                    <X className="w-16 h-16" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white pointer-events-none">
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
                onClick={() => {
                  if (tarotResult) {
                    setShowTarotResultDialog(true);
                  } else {
                    setShowTarotDialog(true);
                  }
                }}
                disabled={tarotLoading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {tarotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yorumlanıyor...
                  </>
                ) : tarotResult ? (
                  "Tarot Sonucunu Gör"
                ) : (
                  "Tarot Baktır"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tarot Falı</DialogTitle>
            <DialogDescription>
              {currentProfile?.full_name || currentProfile?.username} ile ilişkiniz hakkında tarot falı baktırın
            </DialogDescription>
          </DialogHeader>

          {!showCardSelection ? (
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>Soru</Label>
                <Textarea
                  placeholder="İlişki hakkında sormak istediğiniz soruyu yazın..."
                  value={tarotQuestion}
                  onChange={(e) => setTarotQuestion(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getRandomQuestion}
                    className="flex-1 min-w-[120px]"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Rastgele Seç
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getRandomQuestion}
                    className="flex-1 min-w-[120px]"
                    disabled={!tarotQuestion}
                  >
                    Değiştir
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowCardSelection(true)}
                disabled={!tarotQuestion.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Kartları Seç
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                3 kart seçmeniz gerekiyor
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Seçilen Kartlar ({selectedTarotCards.length}/3)</Label>
                {selectedTarotCards.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedTarotCards.map((card, index) => (
                      <Badge key={index} variant="secondary">
                        {card.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 max-h-[450px] overflow-y-auto p-2">
                {majorArcana.map((card) => {
                  const isSelected = selectedTarotCards.find(c => c.id === card.id);
                  return (
                    <button
                      key={card.id}
                      onClick={() => toggleCardSelection(card)}
                      className={`relative group transition-all ${
                        isSelected ? 'ring-2 ring-primary scale-105' : 'hover:scale-105'
                      }`}
                    >
                      <img
                        src={isSelected ? card.image : cardBackImg}
                        alt={isSelected ? card.name : "Tarot Kartı"}
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                      {isSelected && (
                        <>
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {selectedTarotCards.findIndex(c => c.id === card.id) + 1}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-xs text-center rounded-b-lg">
                            {card.name}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCardSelection(false);
                    setSelectedTarotCards([]);
                  }}
                  className="flex-1"
                >
                  Geri
                </Button>
                <Button
                  onClick={handleTarotReading}
                  disabled={tarotLoading || selectedTarotCards.length !== 3}
                  className="flex-1"
                >
                  {tarotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yorumlanıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Tarota Bak (30 Kredi)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
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
                  <h4 className="font-semibold mb-3">🃏 Seçilen Kartlar</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {tarotResult.selectedCards.map((card: any, index: number) => {
                      const cardImage = majorArcana.find(c => c.id === card.id)?.image;
                      return (
                        <div key={index} className="text-center">
                          {cardImage && (
                            <img
                              src={cardImage}
                              alt={card.name}
                              className="w-full h-auto rounded-lg shadow-md mb-2"
                            />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {card.name}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tarotResult.question && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-1 text-sm">❓ Soru</h4>
                  <p className="text-sm text-muted-foreground">{tarotResult.question}</p>
                </div>
              )}

              {tarotResult.interpretation && (
                <div className="space-y-3">
                  {tarotResult.interpretation.overall && (
                    <div>
                      <h4 className="font-semibold mb-2">📖 Genel Yorum</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {tarotResult.interpretation.overall}
                      </p>
                    </div>
                  )}

                  {tarotResult.interpretation.cards && tarotResult.interpretation.cards.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">🎴 Kart Yorumları</h4>
                      <div className="space-y-2">
                        {tarotResult.interpretation.cards.map((cardInterp: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg bg-muted/50">
                            <p className="font-medium text-sm mb-1">{cardInterp.position}</p>
                            <p className="text-xs text-muted-foreground mb-2">{cardInterp.interpretation}</p>
                            {cardInterp.keywords && cardInterp.keywords.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {cardInterp.keywords.map((keyword: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tarotResult.interpretation.advice && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold mb-1 text-sm">💡 Tavsiyeler</h4>
                      <p className="text-sm text-muted-foreground">{tarotResult.interpretation.advice}</p>
                    </div>
                  )}

                  {tarotResult.interpretation.warnings && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <h4 className="font-semibold mb-1 text-sm">⚠️ Dikkat Edilmesi Gerekenler</h4>
                      <p className="text-sm text-muted-foreground">{tarotResult.interpretation.warnings}</p>
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
