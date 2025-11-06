import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { Loader2, Camera, Plus, X, Settings, Calendar, MapPin, Share2, Eye, EyeOff, FileText, Sparkles, Heart, Moon, Hand, Coffee, Star, Send, MessageCircle, RefreshCw, UserX, ShieldOff, Bookmark, Folder as FolderIcon, Trash2 as Trash2Icon, FolderPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { ProfilePosts } from "@/components/ProfilePosts";
import { MutualFriends } from "@/components/MutualFriends";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { soundEffects } from "@/utils/soundEffects";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";
import { Breadcrumb } from "@/components/Breadcrumb";

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
    current_location: "",
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
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [shareAnalysisToPost, setShareAnalysisToPost] = useState<Analysis | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted">("none");
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [profileAnalysisLoading, setProfileAnalysisLoading] = useState(false);
  const [profileAnalysisResult, setProfileAnalysisResult] = useState<string | null>(null);
  const [profileAnalysisDialogOpen, setProfileAnalysisDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [createCollectionDialogOpen, setCreateCollectionDialogOpen] = useState(false);

  const handleRefresh = async () => {
    soundEffects.playClick();
    await loadProfile();
    if (profile.user_id && activeTab === "posts") {
      await loadUserPosts();
    }
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile.user_id && activeTab === "posts") {
      loadUserPosts();
    } else if (profile.user_id && activeTab === "collections" && isOwnProfile) {
      loadCollections();
    }
  }, [profile.user_id, activeTab, isOwnProfile]);

  const loadUserPosts = async () => {
    if (!profile.user_id) return;
    
    setPostsLoading(true);
    try {
      // **PARALEL SORGULAR** - Tüm verileri tek seferde çek
      const [postsResult, likesResult, commentsCountResult, userLikesResult] = await Promise.all([
        // 1. Postları çek
        supabase
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
          .order("created_at", { ascending: false }),
        
        // 2. TÜM like'ları çek
        supabase
          .from("post_likes")
          .select("post_id"),
        
        // 3. TÜM yorumları çek
        supabase
          .from("post_comments")
          .select("post_id"),
        
        // 4. Kullanıcının like'larını çek
        supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", currentUserId)
      ]);

      if (postsResult.data) {
        // Like ve comment sayılarını grupla
        const likesMap = new Map<string, number>();
        (likesResult.data || []).forEach(like => {
          likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
        });

        const commentsMap = new Map<string, number>();
        (commentsCountResult.data || []).forEach(comment => {
          commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1);
        });

        const userLikesSet = new Set(userLikesResult.data?.map(l => l.post_id) || []);

        const postsWithData = postsResult.data.map((post: any) => ({
          ...post,
          profile: post.profiles,
          likes: likesMap.get(post.id) || 0,
          comments: commentsMap.get(post.id) || 0,
          hasLiked: userLikesSet.has(post.id),
        }));

        setUserPosts(postsWithData);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadCollections = async () => {
    if (!profile.user_id) return;
    
    setCollectionsLoading(true);
    try {
      // Load collections
      const { data: collectionsData, error: collError } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (collError) throw collError;

      // Load saved posts
      const { data: savedPostsData, error: savedError } = await supabase
        .from("saved_posts")
        .select(`
          *,
          posts!inner (
            id,
            content,
            media_url,
            media_type,
            created_at,
            profiles!posts_user_id_fkey (
              username,
              full_name,
              profile_photo
            )
          )
        `)
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (savedError) throw savedError;

      // Format saved posts
      const formattedSavedPosts = (savedPostsData || []).map(item => ({
        ...item,
        post: {
          ...item.posts,
          profile: item.posts.profiles
        }
      }));

      setSavedPosts(formattedSavedPosts);

      // Add post counts to collections
      const collectionsWithCount = (collectionsData || []).map(collection => ({
        ...collection,
        postsCount: formattedSavedPosts.filter(sp => sp.collection_id === collection.id).length,
      }));

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Hata",
        description: "Koleksiyon adı gerekli",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: profile.user_id,
          name: newCollectionName,
          description: newCollectionDesc || null,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Koleksiyon oluşturuldu",
      });

      setNewCollectionName("");
      setNewCollectionDesc("");
      setCreateCollectionDialogOpen(false);
      await loadCollections();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Koleksiyon oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleMoveToCollection = async (savedPostId: string, collectionId: string | null) => {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .update({ collection_id: collectionId })
        .eq("id", savedPostId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: collectionId ? "Koleksiyona taşındı" : "Koleksiyondan çıkarıldı",
      });

      await loadCollections();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Koleksiyon silindi",
      });

      await loadCollections();
      setSelectedCollection(null);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Koleksiyon silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleUnsave = async (savedPostId: string) => {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", savedPostId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Gönderi kaydedilenlerden kaldırıldı",
      });

      await loadCollections();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi",
        variant: "destructive",
      });
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Get userId from URL query params if present
      const searchParams = new URLSearchParams(window.location.search);
      const userIdParam = searchParams.get('userId');

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
      } else if (userIdParam) {
        // Looking at another user's profile - search by userId from query param
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userIdParam)
          .maybeSingle();
        profileData = result.data;
        profileError = result.error;
      } else {
        // Looking at own profile - search by user_id
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
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
        setIsLoading(false);
        return;
      }

      if (!profileData) {
        console.error("Profile not found for:", username || user.id);
        toast({
          title: "Profil Bulunamadı",
          description: "Aradığınız profil bulunamadı. Lütfen ayarlardan profil bilgilerinizi tamamlayın.",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate("/settings");
        return;
      }

      setProfile(profileData);
      setIsOwnProfile(profileData.user_id === user.id);

      // **PARALEL SORGULAR** - Tüm sorguları aynı anda başlat
      const [photosResult, friendsResult, friendshipResult, blockResult] = await Promise.all([
        // Photos
        supabase
          .from("user_photos")
          .select("*")
          .eq("user_id", profileData.user_id)
          .order("display_order"),
        
        // Friends
        supabase
          .from("friends")
          .select(`
            *,
            friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo),
            user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo)
          `)
          .or(`user_id.eq.${profileData.user_id},friend_id.eq.${profileData.user_id}`)
          .eq("status", "accepted"),
        
        // Friendship status (only if not own profile)
        profileData.user_id !== user.id
          ? supabase
              .from("friends")
              .select("*")
              .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.user_id}),and(user_id.eq.${profileData.user_id},friend_id.eq.${user.id})`)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        
        // Block status (only if not own profile)
        profileData.user_id !== user.id
          ? supabase
              .from("blocked_users")
              .select("id")
              .eq("user_id", user.id)
              .eq("blocked_user_id", profileData.user_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      // Set results
      if (photosResult.data) setPhotos(photosResult.data);
      if (friendsResult.data) setFriends(friendsResult.data);

      // Set friendship status
      if (profileData.user_id !== user.id && friendshipResult.data) {
        const friendshipData = friendshipResult.data;
        if (friendshipData.status === "accepted") {
          setFriendshipStatus("accepted");
        } else if (friendshipData.user_id === user.id) {
          setFriendshipStatus("pending_sent");
        } else {
          setFriendshipStatus("pending_received");
        }
      } else if (profileData.user_id !== user.id) {
        setFriendshipStatus("none");
      }

      // Set block status
      if (blockResult.data) {
        setIsBlocked(true);
        setBlockId(blockResult.data.id);
      } else {
        setIsBlocked(false);
        setBlockId(null);
      }

      // Load analyses async (don't wait)
      if (profileData.user_id === user.id) {
        Promise.all([
          loadAnalyses(profileData.user_id),
          loadLatestAnalyses(profileData.user_id)
        ]);
      } else {
        loadSharedAnalyses(profileData.user_id);
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
      // **PARALEL SORGULAR** - Tüm analiz sorgularını aynı anda başlat
      const [
        handwritingResult,
        numerologyResult,
        birthChartResult,
        compatibilityResult,
        tarotResult,
        coffeeResult,
        dreamResult,
        palmistryResult,
        horoscopeResult
      ] = await Promise.all([
        supabase.from("analysis_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("numerology_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("birth_chart_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("compatibility_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("tarot_readings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("coffee_fortune_readings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("dream_interpretations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("palmistry_readings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("daily_horoscopes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      // Combine all analyses into a single array
      const allAnalyses: Analysis[] = [
        ...(handwritingResult.data || []).map(item => ({
          ...item,
          analysis_type: item.analysis_type === "full" || item.analysis_type === "selective" ? "handwriting" : item.analysis_type
        })),
        ...(numerologyResult.data || []).map(item => ({
          ...item,
          analysis_type: "numerology"
        })),
        ...(birthChartResult.data || []).map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })),
        ...(compatibilityResult.data || []).map(item => ({
          ...item,
          analysis_type: "compatibility"
        })),
        ...(tarotResult.data || []).map(item => ({
          ...item,
          analysis_type: "tarot",
          result: item.interpretation
        })),
        ...(coffeeResult.data || []).map(item => ({
          ...item,
          analysis_type: "coffee_fortune",
          result: item.interpretation
        })),
        ...(dreamResult.data || []).map(item => ({
          ...item,
          analysis_type: "dream",
          result: item.interpretation
        })),
        ...(palmistryResult.data || []).map(item => ({
          ...item,
          analysis_type: "palmistry",
          result: item.interpretation
        })),
        ...(horoscopeResult.data || []).map(item => ({
          ...item,
          analysis_type: "daily_horoscope",
          result: item.horoscope_text
        })),
      ];

      // Sort by creation date
      allAnalyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
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
    // **PARALEL SORGULAR** - Latest analizleri paralel yükle
    const [birthChartResult, numerologyResult] = await Promise.all([
      supabase.from("birth_chart_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("numerology_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (birthChartResult.data) setLatestBirthChart(birthChartResult.data);
    if (numerologyResult.data) setLatestNumerology(numerologyResult.data);
  };

  const loadSharedAnalyses = async (userId: string) => {
    try {
      // **PARALEL SORGULAR** - Tüm analiz türlerini aynı anda getir
      const [
        handwritingResult,
        numerologyResult,
        birthChartResult,
        compatibilityResult
      ] = await Promise.all([
        supabase.from("analysis_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("numerology_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("birth_chart_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("compatibility_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      ]);

      const allAnalyses: Analysis[] = [
        ...(handwritingResult.data || []).map(item => ({
          ...item,
          analysis_type: item.analysis_type === "full" || item.analysis_type === "selective" ? "handwriting" : item.analysis_type
        })),
        ...(numerologyResult.data || []).map(item => ({
          ...item,
          analysis_type: "numerology"
        })),
        ...(birthChartResult.data || []).map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })),
        ...(compatibilityResult.data || []).map(item => ({
          ...item,
          analysis_type: "compatibility"
        }))
      ];

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
            analysis_id: selectedAnalysis.id,
            analysis_type: selectedAnalysis.analysis_type,
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

  const handleBlockUser = async () => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          user_id: currentUserId,
          blocked_user_id: profile.user_id,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Kullanıcı engellendi.",
      });

      await loadProfile();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı engellenemedi.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockUser = async () => {
    if (!blockId) return;

    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Kullanıcının engeli kaldırıldı.",
      });

      await loadProfile();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Engel kaldırılamadı.",
        variant: "destructive",
      });
    }
  };

  const handleProfileAnalysis = async () => {
    setProfileAnalysisLoading(true);
    setProfileAnalysisResult(null);
    
    try {
      soundEffects.playClick();
      const { data, error } = await supabase.functions.invoke('analyze-user-profile', {
        body: { userId: isOwnProfile ? currentUserId : profile.user_id }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setProfileAnalysisResult(data.analysis);
      setProfileAnalysisDialogOpen(true);
      soundEffects.playMatch();
      toast({
        title: "Analiz tamamlandı",
        description: `${data.creditsUsed} kredi kullanıldı.`,
      });
      
      await loadProfile();
    } catch (error: any) {
      console.error('Profile analysis error:', error);
      soundEffects.playError();
      toast({
        title: "Profil analizi yapılamadı",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setProfileAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container-mobile bg-gradient-subtle">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-mobile bg-gradient-subtle">
      <Header />

      <main ref={containerRef} className="container mx-auto px-4 py-4 max-w-6xl relative">
        {/* Breadcrumb */}
        {!isOwnProfile && profile && (
          <Breadcrumb
            items={[
              { label: profile.full_name || profile.username, path: `/profile/${profile.username}` },
            ]}
          />
        )}
        
        {/* Pull to Refresh Indicator */}
        {(isPulling || isRefreshing) && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-200 z-50"
            style={{ 
              transform: `translateX(-50%) translateY(${Math.min(pullDistance, 80)}px)`,
              opacity: Math.min(pullDistance / 80, 1)
            }}
          >
            <div className={`bg-primary text-primary-foreground rounded-full p-3 shadow-lg ${isRefreshing ? 'animate-spin' : shouldTrigger ? 'scale-110' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Profile Header */}
        <Card className="p-6 mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative flex-shrink-0">
              <Avatar 
                className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary/20 cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => profile.profile_photo && setSelectedProfileImage(profile.profile_photo)}
              >
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
                  <>
                    <Link to="/settings">
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      onClick={handleProfileAnalysis}
                      disabled={profileAnalysisLoading}
                      className="gap-2"
                    >
                      {profileAnalysisLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analiz Ediliyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Profil Analizi (50₺)
                        </>
                      )}
                    </Button>
                  </>
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
                    
                    {!isBlocked ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleBlockUser}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Engelle
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleUnblockUser}
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Engeli Kaldır
                      </Button>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-6 mb-4 text-sm flex-wrap">
                <button 
                  onClick={() => setActiveTab("photos")}
                  className="hover:opacity-70 transition-opacity flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
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
              
              {/* Online Status */}
              {!isOwnProfile && profile.user_id && (
                <div className="mb-3">
                  <OnlineStatusBadge userId={profile.user_id} showLastSeen={true} size="md" />
                </div>
              )}
              
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
                    Doğum: {profile.birth_place}
                  </div>
                )}
                {profile.current_location && (
                  <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    Yaşıyor: {profile.current_location}
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

            {/* Mutual Friends - Show only if viewing another user's profile */}
            {!isOwnProfile && currentUserId && profile.user_id && (
              <MutualFriends userId={currentUserId} profileUserId={profile.user_id} />
            )}
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="analyses">Analizler</TabsTrigger>
            <TabsTrigger value="collections">Koleksiyonlar</TabsTrigger>
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

              {/* Profile Analysis Dialog */}
              <Dialog open={profileAnalysisDialogOpen} onOpenChange={setProfileAnalysisDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Detaylı Profil Analizi
                    </DialogTitle>
                    <DialogDescription>
                      AI destekli kişilik ve profil değerlendirmesi
                    </DialogDescription>
                  </DialogHeader>
                  <Separator className="my-4" />
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {profileAnalysisResult}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(profileAnalysisResult || '');
                        toast({ title: "Kopyalandı", description: "Analiz panoya kopyalandı" });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      📋 Kopyala
                    </Button>
                    <Button 
                      onClick={() => setProfileAnalysisDialogOpen(false)}
                      className="flex-1"
                    >
                      Kapat
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <Card className="p-6">
              {isOwnProfile ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Kayıtlı Gönderilerim</h2>
                    <Dialog open={createCollectionDialogOpen} onOpenChange={setCreateCollectionDialogOpen}>
                      <Button onClick={() => setCreateCollectionDialogOpen(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Koleksiyon
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yeni Koleksiyon</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Input
                            placeholder="Koleksiyon adı"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                          />
                          <Textarea
                            placeholder="Açıklama (isteğe bağlı)"
                            value={newCollectionDesc}
                            onChange={(e) => setNewCollectionDesc(e.target.value)}
                          />
                          <Button onClick={handleCreateCollection} className="w-full">
                            Oluştur
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Tabs value={selectedCollection || "all"} onValueChange={(v) => setSelectedCollection(v === "all" ? null : v)} className="w-full">
                    <TabsList className="mb-4 flex-wrap h-auto">
                      <TabsTrigger value="all" className="gap-2">
                        <Bookmark className="w-4 h-4" />
                        Tümü ({savedPosts.filter(sp => !sp.collection_id).length})
                      </TabsTrigger>
                      {collections.map(collection => (
                        <TabsTrigger
                          key={collection.id}
                          value={collection.id}
                          className="gap-2"
                        >
                          <FolderIcon className="w-4 h-4" />
                          {collection.name} ({collection.postsCount})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value={selectedCollection || "all"}>
                      {selectedCollection && (
                        <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-lg">
                          <div>
                            <h3 className="font-semibold">{collections.find(c => c.id === selectedCollection)?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {collections.find(c => c.id === selectedCollection)?.description}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCollection(selectedCollection)}
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {collectionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : (savedPosts.filter(sp => selectedCollection ? sp.collection_id === selectedCollection : !sp.collection_id).length === 0) ? (
                        <div className="text-center py-12">
                          <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            {selectedCollection ? "Bu koleksiyonda kayıtlı gönderi yok" : "Henüz kayıtlı gönderi yok"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Feed'den gönderileri kaydederek buradan erişebilirsiniz
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {savedPosts
                            .filter(sp => selectedCollection ? sp.collection_id === selectedCollection : !sp.collection_id)
                            .map((saved) => (
                              <Card key={saved.id} className="p-4">
                                <div className="flex items-start gap-4 mb-4">
                                  <Avatar className="w-12 h-12 cursor-pointer" onClick={() => navigate(`/profile/${saved.post.profile.username}`)}>
                                    <AvatarImage src={saved.post.profile.profile_photo || ""} />
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                      {saved.post.profile.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <button
                                          onClick={() => navigate(`/profile/${saved.post.profile.username}`)}
                                          className="font-semibold hover:underline"
                                        >
                                          {saved.post.profile.full_name || saved.post.profile.username}
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                          @{saved.post.profile.username}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Select
                                          value={saved.collection_id || "none"}
                                          onValueChange={(value) =>
                                            handleMoveToCollection(saved.id, value === "none" ? null : value)
                                          }
                                        >
                                          <SelectTrigger className="w-[150px] h-8 text-xs">
                                            <SelectValue placeholder="Koleksiyon" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Koleksiyonsuz</SelectItem>
                                            {collections.map((collection) => (
                                              <SelectItem key={collection.id} value={collection.id}>
                                                {collection.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => handleUnsave(saved.id)}
                                        >
                                          <Trash2Icon className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {saved.post.content && (
                                  <p className="text-sm mb-4 whitespace-pre-wrap">{saved.post.content}</p>
                                )}

                                {saved.post.media_url && (
                                  <div className="rounded-lg overflow-hidden">
                                    {saved.post.media_type === "image" ? (
                                      <img
                                        src={saved.post.media_url}
                                        alt="Post media"
                                        className="w-full max-h-96 object-cover"
                                      />
                                    ) : saved.post.media_type === "video" ? (
                                      <video
                                        src={saved.post.media_url}
                                        controls
                                        className="w-full max-h-96"
                                      />
                                    ) : null}
                                  </div>
                                )}
                              </Card>
                            ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Koleksiyonlar gizli
                </div>
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
                  const friendProfile = friend.user_id === profile.user_id 
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

        {/* Profile Image Zoom Dialog */}
        <Dialog open={!!selectedProfileImage} onOpenChange={() => setSelectedProfileImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <img 
              src={selectedProfileImage || ""} 
              alt="Profile" 
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Profile;
