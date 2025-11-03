import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Plus, X, Settings, Calendar, MapPin, Share2, Eye, EyeOff, FileText, Sparkles, Heart, Moon, Hand, Coffee, Star, Send, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useImpersonate } from "@/hooks/use-impersonate";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { ProfilePosts } from "@/components/ProfilePosts";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  display_order: number;
}

interface Analysis {
  id: string;
  analysis_type: string;
  created_at: string;
  result: any;
  selected_topics?: string[] | null;
  credits_used: number;
  full_name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  gender1?: string;
  gender2?: string;
}

const Profile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState({
    user_id: "",
    username: "",
    full_name: "",
    birth_date: "",
    birth_place: "",
    bio: "",
    gender: "",
    profile_photo: "",
  });
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [visibilityType, setVisibilityType] = useState<"public" | "friends" | "specific_friends" | "friends_except">("friends");
  const [isVisible, setIsVisible] = useState(true);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [selectedFriendForShare, setSelectedFriendForShare] = useState<string>("");
  const [shareNote, setShareNote] = useState("");
  const [shareType, setShareType] = useState<"message" | "feed">("message");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState("");
  const [latestBirthChart, setLatestBirthChart] = useState<any>(null);
  const [latestNumerology, setLatestNumerology] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const { getEffectiveUserId } = useImpersonate();
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [shareAnalysisToPost, setShareAnalysisToPost] = useState<Analysis | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted">("none");

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile.user_id && activeTab === "posts") {
      loadUserPosts();
    }
  }, [profile.user_id, activeTab]);

  const loadUserPosts = async () => {
    if (!profile.user_id) return;
    
    setPostsLoading(true);
    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (postsData) {
        const postsWithData = await Promise.all(
          postsData.map(async (post: any) => {
            const { count: likesCount } = await supabase
              .from("post_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            const { count: commentsCount } = await supabase
              .from("post_comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            const { data: likeCheck } = await supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", currentUserId)
              .maybeSingle();

            return {
              ...post,
              profile: post.profiles,
              likes: likesCount || 0,
              comments: commentsCount || 0,
              hasLiked: !!likeCheck,
            };
          })
        );

        setUserPosts(postsWithData);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
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

      setCurrentUserId(effectiveUserId);

      // If no username in URL, show current user's profile by user_id
      let profileData;
      let profileError;
      
      if (username) {
        // Looking at another user's profile - search by username
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .maybeSingle();
        profileData = result.data;
        profileError = result.error;
      } else {
        // Looking at own profile - search by user_id
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", effectiveUserId)
          .maybeSingle();
        profileData = result.data;
        profileError = result.error;
      }

      if (profileError) {
        console.error("Profile load error:", profileError);
        toast({
          title: "Hata",
          description: "Profil yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      if (!profileData) {
        console.error("Profile not found for:", username || user.id);
        toast({
          title: "Profil Bulunamadı",
          description: "Aradığınız profil bulunamadı. Lütfen ayarlardan profil bilgilerinizi tamamlayın.",
          variant: "destructive",
        });
        navigate("/settings");
        return;
      }

      setProfile(profileData);
      setIsOwnProfile(profileData.user_id === effectiveUserId);

      // Load photos
      const { data: photosData } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("display_order");

      if (photosData) setPhotos(photosData);

      // Load analyses (only if own profile or shared)
      if (profileData.user_id === effectiveUserId) {
        await loadAnalyses(profileData.user_id);
        await loadLatestAnalyses(profileData.user_id);
      } else {
        await loadSharedAnalyses(profileData.user_id);
      }

      // Load friends count
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo),
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user_id.eq.${profileData.user_id},friend_id.eq.${profileData.user_id}`)
        .eq("status", "accepted");

      setFriends(friendsData || []);

      // Check friendship status if not own profile
      if (profileData.user_id !== effectiveUserId) {
        const { data: friendshipData } = await supabase
          .from("friends")
          .select("*")
          .or(`and(user_id.eq.${effectiveUserId},friend_id.eq.${profileData.user_id}),and(user_id.eq.${profileData.user_id},friend_id.eq.${effectiveUserId})`)
          .maybeSingle();

        if (friendshipData) {
          if (friendshipData.status === "accepted") {
            setFriendshipStatus("accepted");
          } else if (friendshipData.user_id === effectiveUserId) {
            setFriendshipStatus("pending_sent");
          } else {
            setFriendshipStatus("pending_received");
          }
        } else {
          setFriendshipStatus("none");
        }
      }
    } catch (error: any) {
      console.error("Profile error details:", error);
      toast({
        title: "Profil Yüklenemedi",
        description: error.message || "Bilinmeyen bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalyses = async (userId: string) => {
    try {
      // Fetch handwriting analyses
      const { data: handwritingData } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch numerology analyses
      const { data: numerologyData } = await supabase
        .from("numerology_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch birth chart analyses
      const { data: birthChartData } = await supabase
        .from("birth_chart_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch compatibility analyses
      const { data: compatibilityData } = await supabase
        .from("compatibility_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch tarot readings
      const { data: tarotData } = await supabase
        .from("tarot_readings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch coffee fortune readings
      const { data: coffeeData } = await supabase
        .from("coffee_fortune_readings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch dream interpretations
      const { data: dreamData } = await supabase
        .from("dream_interpretations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch palmistry readings
      const { data: palmistryData } = await supabase
        .from("palmistry_readings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Fetch daily horoscopes
      const { data: horoscopeData } = await supabase
        .from("daily_horoscopes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Combine all analyses into a single array
      const allAnalyses: Analysis[] = [
        ...(handwritingData || []).map(item => ({
          ...item,
          analysis_type: item.analysis_type === "full" || item.analysis_type === "selective" ? "handwriting" : item.analysis_type
        })),
        ...(numerologyData || []).map(item => ({
          ...item,
          analysis_type: "numerology"
        })),
        ...(birthChartData || []).map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })),
        ...(compatibilityData || []).map(item => ({
          ...item,
          analysis_type: "compatibility"
        })),
        ...(tarotData || []).map(item => ({
          ...item,
          analysis_type: "tarot",
          result: item.interpretation
        })),
        ...(coffeeData || []).map(item => ({
          ...item,
          analysis_type: "coffee_fortune",
          result: item.interpretation
        })),
        ...(dreamData || []).map(item => ({
          ...item,
          analysis_type: "dream",
          result: item.interpretation
        })),
        ...(palmistryData || []).map(item => ({
          ...item,
          analysis_type: "palmistry",
          result: item.interpretation
        })),
        ...(horoscopeData || []).map(item => ({
          ...item,
          analysis_type: "daily_horoscope",
          result: item.horoscope_text
        })),
      ];

      // Sort by created_at descending
      allAnalyses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAnalyses(allAnalyses);
    } catch (error: any) {
      console.error("Error loading analyses:", error);
      toast({
        title: "Hata",
        description: "Analizler yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const loadLatestAnalyses = async (userId: string) => {
    // Load latest birth chart
    const { data: birthChart } = await supabase
      .from("birth_chart_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (birthChart) setLatestBirthChart(birthChart);

    // Load latest numerology
    const { data: numerology } = await supabase
      .from("numerology_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (numerology) setLatestNumerology(numerology);
  };

  const loadSharedAnalyses = async (userId: string) => {
    try {
      // Load all analysis types directly using RLS policies
      // RLS policies will automatically filter based on visibility settings
      
      const allAnalyses: Analysis[] = [];

      // Fetch handwriting analyses
      const { data: handwritingData } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (handwritingData) {
        allAnalyses.push(...handwritingData.map(item => ({
          ...item,
          analysis_type: item.analysis_type === "full" || item.analysis_type === "selective" ? "handwriting" : item.analysis_type
        })));
      }

      // Fetch numerology analyses
      const { data: numerologyData } = await supabase
        .from("numerology_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (numerologyData) {
        allAnalyses.push(...numerologyData.map(item => ({
          ...item,
          analysis_type: "numerology"
        })));
      }

      // Fetch birth chart analyses
      const { data: birthChartData } = await supabase
        .from("birth_chart_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (birthChartData) {
        allAnalyses.push(...birthChartData.map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })));
      }

      // Fetch compatibility analyses
      const { data: compatibilityData } = await supabase
        .from("compatibility_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (compatibilityData) {
        allAnalyses.push(...compatibilityData.map(item => ({
          ...item,
          analysis_type: "compatibility"
        })));
      }

      // Sort by created_at descending
      allAnalyses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAnalyses(allAnalyses);
    } catch (error: any) {
      console.error("Error loading shared analyses:", error);
    }
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const { error } = await supabase
        .from("user_photos")
        .insert({
          user_id: currentUserId,
          photo_url: reader.result as string,
          display_order: photos.length,
        });

      if (error) {
        toast({
          title: "Hata",
          description: "Fotoğraf eklenemedi.",
          variant: "destructive",
        });
        return;
      }

      loadProfile();
      toast({
        title: "Başarılı",
        description: "Fotoğraf eklendi.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!isOwnProfile) return;

    const { error } = await supabase
      .from("user_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf silinemedi.",
        variant: "destructive",
      });
      return;
    }

    loadProfile();
    toast({
      title: "Başarılı",
      description: "Fotoğraf silindi.",
    });
  };

  const getAnalysisTypeLabel = (type: string) => {
    if (type === "handwriting") return "El Yazısı Analizi";
    if (type === "compatibility") return "Uyum Analizi";
    if (type === "numerology") return "Numeroloji Analizi";
    if (type === "birth_chart") return "Doğum Haritası Analizi";
    if (type === "tarot") return "Tarot Okuma";
    if (type === "coffee_fortune") return "Kahve Falı";
    if (type === "dream") return "Rüya Tabiri";
    if (type === "palmistry") return "El Okuma";
    if (type === "daily_horoscope") return "Günlük Kehanet";
    return type;
  };

  const getAnalysisIcon = (type: string) => {
    if (type === "compatibility") return Heart;
    if (type === "numerology") return Sparkles;
    if (type === "birth_chart") return Calendar;
    if (type === "tarot") return Sparkles;
    if (type === "coffee_fortune") return Coffee;
    if (type === "dream") return Moon;
    if (type === "palmistry") return Hand;
    if (type === "daily_horoscope") return Star;
    return FileText;
  };

  const handleSelectAnalysis = (id: string, checked: boolean) => {
    setSelectedAnalysisIds(prev => 
      checked ? [...prev, id] : prev.filter(aid => aid !== id)
    );
  };

  const calculateSummaryCost = () => {
    if (selectedAnalysisIds.length === 0) return 0;
    
    const selectedAnalyses = analyses.filter(a => selectedAnalysisIds.includes(a.id));
    const totalCredits = selectedAnalyses.reduce((sum, a) => sum + a.credits_used, 0);
    
    if (selectedAnalysisIds.length === 1) {
      return Math.ceil(totalCredits / 3);
    } else {
      return Math.ceil((totalCredits * selectedAnalysisIds.length) / 3);
    }
  };

  const handleSummarize = async () => {
    if (selectedAnalysisIds.length === 0) {
      toast({
        title: "Analiz seçilmedi",
        description: "Lütfen özetlemek için en az bir analiz seçin.",
        variant: "destructive",
      });
      return;
    }

    setIsSummarizing(true);
    setSummaryResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-analyses', {
        body: { analysisIds: selectedAnalysisIds }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error === 'Insufficient credits') {
          toast({
            title: "Yetersiz kredi",
            description: `${data.required} kredi gerekli, ${data.available} krediniz var.`,
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      setSummaryResult(data.summary);
      toast({
        title: "Özet oluşturuldu",
        description: `${data.analysisCount} analiz özeti başarıyla oluşturuldu. ${data.creditsUsed} kredi kullanıldı.`,
      });
      
      await loadProfile();
      
    } catch (error: any) {
      console.error('Summarize error:', error);
      toast({
        title: "Özet oluşturulamadı",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleShareAnalysis = async () => {
    if (!selectedAnalysis) return;

    try {
      if (shareType === "message") {
        if (!selectedFriendForShare) {
          toast({
            title: "Hata",
            description: "Lütfen bir arkadaş seçin.",
            variant: "destructive",
          });
          return;
        }

        const messageContent = `📊 ${getAnalysisTypeLabel(selectedAnalysis.analysis_type)} sonucumu paylaştım!\n\n${shareNote || "Analiz sonucumu görmek için tıkla."}\n\n[Analiz ID: ${selectedAnalysis.id}]\n[Analiz Türü: ${selectedAnalysis.analysis_type}]`;

        const { error: shareError } = await supabase
          .from("shared_analyses")
          .insert({
            user_id: currentUserId,
            analysis_id: selectedAnalysis.id,
            analysis_type: selectedAnalysis.analysis_type,
            shared_with_user_id: selectedFriendForShare,
            visibility_type: "specific_friends",
            is_visible: true,
            is_public: false,
          });

        if (shareError) {
          await supabase
            .from("shared_analyses")
            .update({
              shared_with_user_id: selectedFriendForShare,
              visibility_type: "specific_friends",
              is_visible: true,
            })
            .eq("analysis_id", selectedAnalysis.id)
            .eq("user_id", currentUserId);
        }

        const { error } = await supabase
          .from("messages")
          .insert({
            sender_id: currentUserId,
            receiver_id: selectedFriendForShare,
            content: messageContent,
          });

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Analiz arkadaşınıza gönderildi.",
        });
      } else {
        toast({
          title: "Bilgi",
          description: "Profil akışı özelliği yakında eklenecek.",
        });
      }

      setShareDialogOpen(false);
      setShareNote("");
      setSelectedFriendForShare("");
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılamadı.",
        variant: "destructive",
      });
    }
  };

  const handleVisibilitySettings = async () => {
    if (!selectedAnalysis) return;

    try {
      const { data: existingShare } = await supabase
        .from("shared_analyses")
        .select("id")
        .eq("analysis_id", selectedAnalysis.id)
        .eq("analysis_type", selectedAnalysis.analysis_type)
        .maybeSingle();

      const shareData = {
        user_id: currentUserId,
        analysis_id: selectedAnalysis.id,
        analysis_type: selectedAnalysis.analysis_type,
        visibility_type: visibilityType,
        is_visible: isVisible,
        is_public: visibilityType === "public",
        allowed_user_ids: visibilityType === "specific_friends" ? selectedFriendIds : null,
        blocked_user_ids: visibilityType === "friends_except" ? selectedFriendIds : null,
      };

      if (existingShare) {
        const { error } = await supabase
          .from("shared_analyses")
          .update(shareData)
          .eq("id", existingShare.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shared_analyses")
          .insert(shareData);

        if (error) throw error;
      }

      toast({
        title: "Başarılı",
        description: "Görünürlük ayarları güncellendi.",
      });

      setVisibilityDialogOpen(false);
    } catch (error: any) {
      console.error("Visibility error:", error);
      toast({
        title: "Hata",
        description: "Görünürlük ayarları güncellenemedi.",
        variant: "destructive",
      });
    }
  };

  const openShareDialog = async (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setShareDialogOpen(true);
    setShareNote("");
    setSelectedFriendForShare("");
    setShareType("message");
  };

  const openVisibilityDialog = async (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setVisibilityDialogOpen(true);
    
    const { data: existingShare } = await supabase
      .from("shared_analyses")
      .select("*")
      .eq("analysis_id", analysis.id)
      .eq("analysis_type", analysis.analysis_type)
      .maybeSingle();

    if (existingShare) {
      const vt = existingShare.visibility_type as "public" | "friends" | "specific_friends" | "friends_except";
      setVisibilityType(vt || "friends");
      setIsVisible(existingShare.is_visible ?? true);
      setSelectedFriendIds(existingShare.allowed_user_ids || []);
    } else {
      setVisibilityType("friends");
      setIsVisible(true);
      setSelectedFriendIds([]);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_photo: reader.result as string })
        .eq("user_id", currentUserId);

      if (error) {
        toast({
          title: "Hata",
          description: "Profil fotoğrafı güncellenemedi.",
          variant: "destructive",
        });
        return;
      }

      loadProfile();
      toast({
        title: "Başarılı",
        description: "Profil fotoğrafı güncellendi.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .insert({
          user_id: currentUserId,
          friend_id: profile.user_id,
          status: "pending",
        });

      if (error) throw error;

      setFriendshipStatus("pending_sent");
      toast({
        title: "Başarılı",
        description: "Arkadaşlık isteği gönderildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği gönderilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("user_id", profile.user_id)
        .eq("friend_id", currentUserId);

      if (error) throw error;

      setFriendshipStatus("accepted");
      toast({
        title: "Başarılı",
        description: "Arkadaşlık isteği kabul edildi.",
      });
      loadProfile();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği kabul edilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleRejectFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", profile.user_id)
        .eq("friend_id", currentUserId);

      if (error) throw error;

      setFriendshipStatus("none");
      toast({
        title: "Başarılı",
        description: "Arkadaşlık isteği reddedildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği reddedilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleCancelFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", currentUserId)
        .eq("friend_id", profile.user_id);

      if (error) throw error;

      setFriendshipStatus("none");
      toast({
        title: "Başarılı",
        description: "Arkadaşlık isteği iptal edildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği iptal edilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.user_id}),and(user_id.eq.${profile.user_id},friend_id.eq.${currentUserId})`);

      if (error) throw error;

      setFriendshipStatus("none");
      toast({
        title: "Başarılı",
        description: "Arkadaşlıktan çıkarıldı.",
      });
      loadProfile();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaşlıktan çıkarılamadı.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative flex-shrink-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary/20">
                <AvatarImage src={profile.profile_photo} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl">
                  {profile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg">
                  <Camera className="w-5 h-5 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

              <div className="flex-1">
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                {isOwnProfile ? (
                  <Link to="/settings">
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </Link>
                ) : (
                  <>
                    {friendshipStatus === "none" && (
                      <Button size="sm" onClick={handleSendFriendRequest}>
                        <Plus className="w-4 h-4 mr-2" />
                        Arkadaş Ekle
                      </Button>
                    )}
                    {friendshipStatus === "pending_sent" && (
                      <Button size="sm" variant="outline" onClick={handleCancelFriendRequest}>
                        İstek Gönderildi
                      </Button>
                    )}
                    {friendshipStatus === "pending_received" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAcceptFriendRequest}>
                          Kabul Et
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRejectFriendRequest}>
                          Reddet
                        </Button>
                      </div>
                    )}
                    {friendshipStatus === "accepted" && (
                      <Button size="sm" variant="outline" onClick={handleRemoveFriend}>
                        Arkadaş
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-6 mb-4 text-sm flex-wrap">
                <button 
                  onClick={() => setActiveTab("photos")}
                  className="hover:opacity-70 transition-opacity"
                >
                  <span className="font-bold">{photos.length}</span> fotoğraf
                </button>
                <button 
                  onClick={() => setActiveTab("analyses")}
                  className="hover:opacity-70 transition-opacity"
                >
                  <span className="font-bold">{analyses.length}</span> analiz
                </button>
                <button 
                  onClick={() => setFriendsDialogOpen(true)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <span className="font-bold">{friends.length}</span> arkadaş
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
              
              {profile.bio && (
                <p className="text-sm mb-3">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile.birth_date && (
                  <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {new Date(profile.birth_date).toLocaleDateString('tr-TR')}
                  </div>
                )}
                {profile.birth_place && (
                  <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {profile.birth_place}
                  </div>
                )}
                {latestBirthChart?.result?.sun_sign && (
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium">
                    ☀️ {latestBirthChart.result.sun_sign}
                  </div>
                )}
                {latestBirthChart?.result?.ascendant && (
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium">
                    ⬆️ Yükselen: {latestBirthChart.result.ascendant}
                  </div>
                )}
                {latestNumerology?.result?.life_path_number && (
                  <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1.5 rounded-full text-secondary font-medium">
                    🔢 Yaşam Yolu: {latestNumerology.result.life_path_number}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="analyses">Analizler</TabsTrigger>
            <TabsTrigger value="friends">Arkadaşlar</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <ProfilePosts posts={userPosts} loading={postsLoading} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="analyses">
            <Card className="p-6">
              {isOwnProfile && analyses.length > 0 && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="text-sm text-muted-foreground">
                    {selectedAnalysisIds.length > 0 && (
                      <span>{selectedAnalysisIds.length} analiz seçildi - {calculateSummaryCost()} kredi harcanacak</span>
                    )}
                  </div>
                  <Button 
                    onClick={handleSummarize}
                    disabled={selectedAnalysisIds.length === 0 || isSummarizing}
                    size="sm"
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Özetleniyor...
                      </>
                    ) : (
                      `Özetle (${selectedAnalysisIds.length})`
                    )}
                  </Button>
                </div>
              )}

              {analyses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {isOwnProfile ? "Henüz analiziniz yok" : "Paylaşılmış analiz bulunmuyor"}
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => {
                    const Icon = getAnalysisIcon(analysis.analysis_type);
                    const isSelected = selectedAnalysisIds.includes(analysis.id);
                    return (
                      <Card
                        key={analysis.id}
                        className={`p-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {isOwnProfile && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectAnalysis(analysis.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm mb-1">
                                    {getAnalysisTypeLabel(analysis.analysis_type)}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(analysis.created_at).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs">{analysis.credits_used} Kredi</Badge>
                              </div>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openShareDialog(analysis);
                                }}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openVisibilityDialog(analysis);
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Analysis Detail Dialog */}
              <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedAnalysis && getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedAnalysis && new Date(selectedAnalysis.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedAnalysis && (
                    <div className="pt-4">
                      <AnalysisDetailView 
                        result={selectedAnalysis.result} 
                        analysisType={selectedAnalysis.analysis_type}
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Share Dialog */}
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Analizi Paylaş</DialogTitle>
                    <DialogDescription>
                      {selectedAnalysis && getAnalysisTypeLabel(selectedAnalysis.analysis_type)} sonucunuzu paylaşın
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Paylaşım Türü</Label>
                      <Select value={shareType} onValueChange={(value: any) => setShareType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">Arkadaşa Mesaj Gönder</SelectItem>
                          <SelectItem value="feed">Profil Akışına Paylaş</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {shareType === "message" && (
                      <div>
                        <Label>Arkadaş Seç</Label>
                        <Select value={selectedFriendForShare} onValueChange={setSelectedFriendForShare}>
                          <SelectTrigger>
                            <SelectValue placeholder="Arkadaş seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {friends.length === 0 ? (
                              <SelectItem value="none" disabled>Henüz arkadaşınız yok</SelectItem>
                            ) : (
                              friends.map((friend) => {
                                const friendProfile = friend.user_id === currentUserId 
                                  ? friend.friend_profile 
                                  : friend.user_profile;
                                const friendId = friendProfile?.user_id;
                                
                                if (!friendId) return null;
                                
                                return (
                                  <SelectItem key={friend.id} value={friendId}>
                                    {friendProfile?.full_name || friendProfile?.username || "Arkadaş"}
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Not Ekle (İsteğe Bağlı)</Label>
                      <Textarea
                        value={shareNote}
                        onChange={(e) => setShareNote(e.target.value)}
                        placeholder="Paylaşırken bir not ekleyebilirsiniz..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleShareAnalysis}
                      className="w-full"
                      disabled={shareType === "message" && !selectedFriendForShare}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Paylaş
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Visibility Settings Dialog */}
              <Dialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Görünürlük Ayarları</DialogTitle>
                    <DialogDescription>
                      Bu analizin kimler tarafından görülebileceğini ayarlayın
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="visible">Görünür</Label>
                      <Switch
                        id="visible"
                        checked={isVisible}
                        onCheckedChange={setIsVisible}
                      />
                    </div>

                    <div>
                      <Label>Görünürlük</Label>
                      <Select value={visibilityType} onValueChange={(value: any) => setVisibilityType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Herkes</SelectItem>
                          <SelectItem value="friends">Tüm Arkadaşlarım</SelectItem>
                          <SelectItem value="specific_friends">Sadece Seçtiklerim</SelectItem>
                          <SelectItem value="friends_except">Seçtiklerim Hariç</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(visibilityType === "specific_friends" || visibilityType === "friends_except") && (
                      <div>
                        <Label>
                          {visibilityType === "specific_friends" ? "Paylaşılacak Arkadaşlar" : "Hariç Tutulacak Arkadaşlar"}
                        </Label>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {friends.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Henüz arkadaşınız yok
                            </p>
                          ) : (
                            friends.map((friend) => {
                              const friendProfile = friend.user_id === currentUserId 
                                ? friend.friend_profile 
                                : friend.user_profile;
                              const friendId = friendProfile?.user_id;
                              
                              if (!friendId) return null;
                              
                              return (
                                <div key={friend.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`friend-${friend.id}`}
                                    checked={selectedFriendIds.includes(friendId)}
                                    onCheckedChange={() => toggleFriendSelection(friendId)}
                                  />
                                  <label
                                    htmlFor={`friend-${friend.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                  >
                                    {friendProfile?.full_name || friendProfile?.username || "Arkadaş"}
                                  </label>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleVisibilitySettings}
                      className="w-full"
                      disabled={(visibilityType === "specific_friends" || visibilityType === "friends_except") && selectedFriendIds.length === 0}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ayarları Kaydet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Summary Dialog */}
              <Dialog open={!!summaryResult} onOpenChange={() => setSummaryResult(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Analiz Özeti</DialogTitle>
                    <DialogDescription>
                      {selectedAnalysisIds.length} analiz özeti
                    </DialogDescription>
                  </DialogHeader>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">{summaryResult}</p>
                  </div>
                  <Button onClick={() => {
                    setSummaryResult(null);
                    setSelectedAnalysisIds([]);
                  }}>
                    Kapat
                  </Button>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          <TabsContent value="friends">
            <Card className="p-6">
              {isOwnProfile ? (
                <div className="text-center py-12">
                  <Button 
                    onClick={() => navigate("/friends")}
                    size="lg"
                    className="bg-gradient-primary"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Arkadaş Listesine Git
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Tüm arkadaşlarınızı görüntüleyin ve yeni arkadaşlar ekleyin
                  </p>
                </div>
              ) : (
                <>
                  {friends.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Arkadaş bilgisi görüntülenemiyor
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {friends.map((friend) => {
                        // Determine which profile to show (not the current user)
                        const friendProfile = friend.user_id === currentUserId 
                          ? friend.friend_profile 
                          : friend.user_profile;
                        
                        if (!friendProfile) return null;
                        
                        return (
                          <div
                            key={friend.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/profile/${friendProfile.username}`)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={friendProfile.profile_photo} alt={friendProfile.username} />
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                  {friendProfile.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{friendProfile.full_name || friendProfile.username}</p>
                                <p className="text-sm text-muted-foreground">@{friendProfile.username}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Friends Dialog */}
        <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Arkadaşlar</DialogTitle>
              <DialogDescription>
                {friends.length} arkadaş
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? "Henüz arkadaşınız yok" : "Arkadaş bilgisi görüntülenemiyor"}
                </div>
              ) : (
                friends.map((friend) => {
                  const friendProfile = friend.user_id === currentUserId 
                    ? friend.friend_profile 
                    : friend.user_profile;
                  
                  if (!friendProfile) return null;
                  
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setFriendsDialogOpen(false);
                        navigate(`/profile/${friendProfile.username}`);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friendProfile.profile_photo} alt={friendProfile.username} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {friendProfile.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{friendProfile.full_name || friendProfile.username}</p>
                          <p className="text-xs text-muted-foreground">@{friendProfile.username}</p>
                        </div>
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFriendsDialogOpen(false);
                            navigate(`/messages?userId=${friendProfile.user_id}`);
                          }}
                        >
                          Mesaj
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Post Dialog */}
        <CreatePostDialog
          open={createPostDialogOpen}
          onOpenChange={setCreatePostDialogOpen}
          userId={currentUserId}
          username={profile.username}
          profilePhoto={profile.profile_photo}
          onPostCreated={() => {
            loadUserPosts();
            toast({
              title: "Başarılı",
              description: "Gönderi oluşturuldu",
            });
          }}
        />

        {/* Floating Action Button */}
        {isOwnProfile && (
          <Button
            size="icon"
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:scale-110 transition-transform z-50"
            onClick={() => setCreatePostDialogOpen(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
      </main>
    </div>
  );
};

export default Profile;
