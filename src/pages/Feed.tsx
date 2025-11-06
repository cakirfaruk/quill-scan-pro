import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedFeed } from "@/hooks/use-optimized-feed";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { FeedPostCard } from "@/components/FeedPostCard";
import { FeedCommentItem } from "@/components/FeedCommentItem";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Folder, FolderPlus, Rss, Users, Sparkles, Search, Home, MessageCircle, Reply } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { soundEffects } from "@/utils/soundEffects";
import { StoriesBar } from "@/components/StoriesBar";
import { SkeletonPost } from "@/components/ui/enhanced-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { LazyCreatePostDialog, LazyFullScreenMediaViewer } from "@/utils/lazyImports";
import { NoFriendsIllustration, NoPostsIllustration } from "@/components/EmptyStateIllustrations";
import { ScrollReveal } from "@/components/ScrollReveal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { WidgetDashboard } from "@/components/WidgetDashboard";
import { Virtuoso } from "react-virtuoso";
import { Suspense } from "react";
import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOfflineCache } from "@/hooks/use-offline-cache";
import { useOptimisticUI } from "@/hooks/use-optimistic-ui";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  created_at: string;
  shares_count: number;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasSaved: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user_id: string;
  user: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  hasLiked: boolean;
  replies: Comment[];
}

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { shouldShowOnboarding, markOnboardingComplete } = useOnboarding();
  const { user, userId: authUserId, isLoading: authLoading } = useAuth(); // AUTH CONTEXT
  const [userId, setUserId] = useState<string>("");
  const isOnline = useNetworkStatus();
  const { addToQueue } = useEnhancedOfflineSync();
  const { addOptimisticItem, optimisticItems, getSyncStatus } = useOptimisticUI();
  
  // Offline cache for posts
  const {
    cachedData: cachedPosts,
    isLoadingCache,
    saveToCache: savePosts,
    syncWithOnlineData: syncPosts,
  } = useOfflineCache<Post>({ 
    storeName: 'posts',
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // **OPTIMIZED FEED HOOK** - Keyset pagination + batch queries
  const { 
    posts: allPosts, 
    likeCounts, 
    userLikes, 
    commentCounts,
    savedPosts,
    isLoading: feedLoading, 
    loadMore 
  } = useOptimizedFeed(userId);
  
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "photo" | "video" }[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // **OPTIMIZED & ENRICHED POSTS** - useMemo ile cache'lenir
  const enrichedPosts = useMemo(() => {
    const onlinePosts = allPosts.map((post: any) => ({
      ...post,
      profile: post.profiles || { username: '', full_name: '', profile_photo: null },
      likes: likeCounts[post.id] || 0,
      comments: commentCounts[post.id] || 0,
      hasLiked: userLikes[post.id] || false,
      hasSaved: savedPosts[post.id] || false,
      shares_count: post.shares_count || 0
    }));
    
    // Add optimistic posts at the top
    const optimisticPosts = optimisticItems
      .filter(item => item.type === 'post')
      .map(item => ({
        ...item.data,
        _optimistic: true,
        _status: item.status,
      }));
    
    // If offline and no online posts, use cached posts
    if (!isOnline && onlinePosts.length === 0 && cachedPosts.length > 0) {
      return [...optimisticPosts, ...cachedPosts];
    }
    
    return [...optimisticPosts, ...onlinePosts];
  }, [allPosts, likeCounts, commentCounts, userLikes, savedPosts, isOnline, cachedPosts, optimisticItems]);

  // **FRIENDS POSTS** - Arkadaş postları filtrele
  const friendsPosts = useMemo(() => {
    const friendIds = new Set(friends.map(f => f.user_id));
    return enrichedPosts.filter(p => friendIds.has(p.user_id) || p.user_id === userId);
  }, [enrichedPosts, friends, userId]);

  // Cache posts when online
  useEffect(() => {
    if (isOnline && enrichedPosts.length > 0) {
      savePosts(enrichedPosts.slice(0, 50)); // Cache first 50 posts
    }
  }, [enrichedPosts, isOnline, savePosts]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewPost: () => {
      if (userId) setCreatePostOpen(true);
    },
    onSearch: () => {
      // Trigger global search (already exists in Header)
      const searchButton = document.querySelector('button[class*="w-8 sm:w-9"]') as HTMLButtonElement;
      searchButton?.click();
    },
    onShowHelp: () => setShortcutsHelpOpen(true),
  });

  const onboardingSteps = [
    {
      id: "welcome",
      title: "KAM'a Hoş Geldin! 🎉",
      description: "Kendini keşfet, ruhunu tanı ve eşini bul! Sana platformu tanıtalım.",
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      position: "center" as const,
    },
    {
      id: "search",
      title: "Global Arama",
      description: "⌘K veya Ctrl+K ile her yerden aramayı açabilirsin. Kullanıcılar, gönderiler, gruplar ve özellikler arasında hızlıca arama yapabilirsin.",
      targetSelector: 'button[class*="w-8 sm:w-9"]',
      position: "bottom" as const,
      icon: <Search className="w-5 h-5 text-primary" />,
    },
    {
      id: "home",
      title: "Ana Sayfa Sekmeler",
      description: "Arkadaşların veya tüm kullanıcıların gönderilerini görebilirsin. İstediğin zaman geçiş yapabilirsin.",
      targetSelector: '[role="tablist"]',
      position: "bottom" as const,
      icon: <Home className="w-5 h-5 text-primary" />,
    },
    {
      id: "stories",
      title: "Hikayeler",
      description: "Arkadaşlarının hikayelerini görüntüle veya kendi hikayeni paylaş!",
      targetSelector: '[class*="stories"]',
      position: "bottom" as const,
      icon: <Rss className="w-5 h-5 text-primary" />,
    },
    {
      id: "features",
      title: "Fal ve Analiz Özellikleri",
      description: "Tarot, kahve falı, numeroloji, doğum haritası ve daha fazlası! Global arama ile hızlıca erişebilirsin.",
      position: "center" as const,
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      action: {
        label: "Özellikleri Keşfet",
        onClick: () => {
          // Open search
          const searchButton = document.querySelector('button[class*="w-8 sm:w-9"]') as HTMLButtonElement;
          searchButton?.click();
        },
      },
    },
  ];

  const handleRefresh = useCallback(async () => {
    soundEffects.playClick();
    if (userId) {
      // **REACT QUERY CACHE INVALIDATION** - Daha hızlı
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
      
      // Sync cached posts with fresh online data
      if (isOnline && enrichedPosts.length > 0) {
        await syncPosts(enrichedPosts);
      }
    }
  }, [userId, queryClient, isOnline, enrichedPosts, syncPosts]);

  const { containerRef, isPulling, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // **AUTH CONTEXT KULLANIMI** - Tek seferlik auth kontrolü
  useEffect(() => {
    if (authLoading) return; // Auth yükleniyor, bekle
    
    if (!user) {
      console.log("Feed: No user found, redirecting to auth");
      navigate("/auth");
      return;
    }

    console.log("Feed: User authenticated from context, loading profile");
    setUserId(user.id);
    checkUserAndLoad(user.id);
  }, [user, authLoading]);

  const checkUserAndLoad = async (currentUserId: string) => {
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, profile_photo")
        .eq("user_id", currentUserId)
        .single();
      
      if (profile) {
        setUsername(profile.username);
        setProfilePhoto(profile.profile_photo);
      }
      
      // **SADECE ARKADAŞLARI YÜKLEyalım** - Postlar optimized hook ile gelecek
      await loadFriends(currentUserId);
    } catch (error) {
      console.error("Error loading feed:", error);
      
      // If offline, show cached content
      if (!isOnline && cachedPosts.length > 0) {
        toast({
          title: "Çevrimdışı Mod",
          description: `${cachedPosts.length} önbelleğe alınmış gönderi gösteriliyor`,
        });
      } else {
        toast({
          title: "Hata",
          description: "Sayfa yüklenirken bir hata oluştu",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (currentUserId: string) => {
    try {
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          user_id,
          friend_id,
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq("status", "accepted");

      if (!friendsData) return;

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
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  // **ARTIK GEREK YOK** - Optimized hook kullanıyoruz
  // loadPosts fonksiyonu kaldırıldı

  // **OPTIMISTIC UPDATE** - Anında UI güncelleme, sonra backend
  const handleLike = useCallback(async (postId: string, hasLiked: boolean) => {
    try {
      // 1. UI'ı hemen güncelle (optimistic)
      queryClient.setQueryData(['feed', 'optimized'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likeCounts: {
            ...old.likeCounts,
            [postId]: (old.likeCounts[postId] || 0) + (hasLiked ? -1 : 1)
          },
          userLikes: {
            ...old.userLikes,
            [postId]: !hasLiked
          }
        };
      });

      // 2. Backend işlemi
      if (hasLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      } else {
        soundEffects.playLike();
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      }
      
      // 3. Cache'i invalidate et (arka planda güncellensin)
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
      // Hata durumunda cache'i geri al
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
    }
  }, [userId, queryClient]);

  const handleSave = useCallback(async (postId: string, hasSaved: boolean) => {
    if (hasSaved) {
      try {
        await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
        toast({ title: "Kaydedildi", description: "Gönderi kaydedilenlerden kaldırıldı" });
        queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
      } catch (error: any) {
        soundEffects.playError();
        toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
      }
    } else {
      const post = enrichedPosts.find(p => p.id === postId);
      if (post) {
        setPostToSave(post);
        setSaveDialogOpen(true);
      }
    }
  }, [userId, enrichedPosts, queryClient]);

  const handleConfirmSave = async () => {
    if (!postToSave) return;

    try {
      soundEffects.playClick();
      await supabase.from("saved_posts").insert({
        post_id: postToSave.id,
        user_id: userId,
        collection_id: selectedCollection || null,
      });
      toast({
        title: "Kaydedildi",
        description: selectedCollection
          ? "Gönderi koleksiyona kaydedildi"
          : "Gönderi başarıyla kaydedildi"
      });
      // Cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
      setSaveDialogOpen(false);
      setPostToSave(null);
      setSelectedCollection("");
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
    }
  };

  const handleCommentLike = async (commentId: string, hasLiked: boolean) => {
    try {
      if (hasLiked) {
        await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
      } else {
        soundEffects.playLike();
        await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
      }
      if (selectedPost) await loadComments(selectedPost.id);
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      // **PARALEL YÜKLEME** - Yorumları ve like'ları aynı anda çek
      const [commentsResult, likesResult, userLikesResult] = await Promise.all([
        supabase
          .from("post_comments")
          .select(`
            *,
            profiles!post_comments_user_id_fkey (
              username,
              full_name,
              profile_photo
            )
          `)
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
        
        supabase
          .from("comment_likes")
          .select("comment_id"),
        
        supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", userId)
      ]);

      if (commentsResult.error) throw commentsResult.error;

      // Like sayılarını grupla
      const likesMap = new Map<string, number>();
      (likesResult.data || []).forEach(like => {
        likesMap.set(like.comment_id, (likesMap.get(like.comment_id) || 0) + 1);
      });

      const userLikesSet = new Set(userLikesResult.data?.map(l => l.comment_id) || []);

      const commentsWithLikes = (commentsResult.data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        parent_comment_id: c.parent_comment_id,
        user_id: c.user_id,
        user: c.profiles,
        likes: likesMap.get(c.id) || 0,
        hasLiked: userLikesSet.has(c.id),
        replies: [],
      }));

      // Organize comments into parent-child structure
      const parentComments = commentsWithLikes.filter(c => !c.parent_comment_id);
      const childComments = commentsWithLikes.filter(c => c.parent_comment_id);

      parentComments.forEach(parent => {
        parent.replies = childComments.filter(child => child.parent_comment_id === parent.id);
      });

      setComments(parentComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentsDialogOpen(true);
    setComments([]); // Reset comments
    await loadComments(post.id);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      soundEffects.playMessageSent();
      
      if (!isOnline) {
        // Offline - add optimistically and queue
        const optimisticId = addOptimisticItem('comment', {
          post_id: selectedPost.id,
          user_id: userId,
          content: newComment.trim(),
          parent_comment_id: replyingTo,
          created_at: new Date().toISOString(),
        });
        
        setNewComment("");
        setReplyingTo(null);
        return;
      }
      
      await supabase.from("post_comments").insert({
        post_id: selectedPost.id,
        user_id: userId,
        content: newComment.trim(),
        parent_comment_id: replyingTo,
      });

      setNewComment("");
      setReplyingTo(null);
      await loadComments(selectedPost.id);
      // Yorum eklendikten sonra cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "Yorum eklenemedi", variant: "destructive" });
    }
  };

  const handleOpenShareDialog = (post: Post) => {
    setPostToShare(post);
    setSelectedFriends(new Set());
    setShareDialogOpen(true);
  };

  const handleShareToFriends = async () => {
    if (!postToShare || selectedFriends.size === 0) {
      toast({ title: "Uyarı", description: "Lütfen en az bir arkadaş seçin", variant: "destructive" });
      return;
    }

    try {
      // Create message content with post info
      let messageContent = `📸 ${postToShare.profile.full_name || postToShare.profile.username} adlı kişinin paylaşımı:\n\n`;
      if (postToShare.content) {
        messageContent += postToShare.content.substring(0, 100);
        if (postToShare.content.length > 100) messageContent += "...";
      }

      // Send messages to selected friends
      const messagesToInsert = Array.from(selectedFriends).map(friendId => ({
        sender_id: userId,
        receiver_id: friendId,
        content: messageContent,
        message_category: "friend" as const,
      }));

      const { error: messageError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (messageError) throw messageError;

      // Update shares count
      await supabase
        .from("posts")
        .update({ shares_count: (postToShare.shares_count || 0) + selectedFriends.size })
        .eq("id", postToShare.id);

      toast({ 
        title: "Başarılı", 
        description: `Gönderi ${selectedFriends.size} arkadaşınıza gönderildi` 
      });

      setShareDialogOpen(false);
      // Cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['feed', 'optimized'] });
    } catch (error: any) {
      toast({ title: "Hata", description: "Gönderi paylaşılamadı", variant: "destructive" });
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  const handleLoadMore = useCallback(async () => {
    if (!userId || feedLoading) return;
    loadMore(); // Use optimized hook's loadMore
  }, [userId, feedLoading, loadMore]);

  const renderComment = (comment: Comment) => (
    <FeedCommentItem
      key={comment.id}
      comment={comment}
      onLike={handleCommentLike}
      onReply={(commentId) => setReplyingTo(commentId)}
    />
  );

  const renderPost = (post: Post) => (
    <FeedPostCard
      key={post.id}
      post={post}
      onLike={handleLike}
      onComment={handleOpenComments}
      onShare={handleOpenShareDialog}
      onSave={handleSave}
      onMediaClick={(media, index) => {
        setSelectedMedia(media);
        setSelectedMediaIndex(index);
        setMediaViewerOpen(true);
      }}
    />
  );

  if (loading) {
    return (
      <div className="page-container-mobile bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl space-y-4 sm:space-y-6">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-mobile bg-gradient-subtle">
      <Header />
      <div ref={containerRef} className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-2xl relative">
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

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
          Akış
        </h1>

        {/* Stories Bar */}
        {userId && (
          <ScrollReveal direction="down" delay={0.1}>
            <Card className="mb-4 sm:mb-6 overflow-hidden">
              <StoriesBar currentUserId={userId} />
            </Card>
          </ScrollReveal>
        )}

        <Tabs defaultValue="friends" className="w-full space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="friends" className="text-sm sm:text-base">Arkadaşlarım</TabsTrigger>
            <TabsTrigger value="discover" className="text-sm sm:text-base">Keşfet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-0">
            {friendsPosts.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Henüz arkadaşınızın paylaşımı yok"
                description="Arkadaşlarınızın paylaşımlarını görmek için keşfet sekmesinden yeni insanlarla tanışın ve arkadaş olun."
                actionLabel="Arkadaş Bul"
                onAction={() => navigate("/discovery")}
                illustration={<NoFriendsIllustration />}
                variant="gradient"
              />
            ) : (
              <Virtuoso
                data={friendsPosts}
                endReached={handleLoadMore}
                itemContent={(index, post) => (
                  <div key={post.id} className="mb-4">
                    {renderPost(post)}
                  </div>
                )}
                components={{
                  Footer: () => feedLoading ? (
                    <div className="py-8">
                      <LoadingSpinner size="md" text="Daha fazla gönderi yükleniyor..." />
                    </div>
                  ) : null
                }}
                style={{ height: '100vh' }}
                increaseViewportBy={{ top: 600, bottom: 600 }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="mt-0">
            {allPosts.length === 0 ? (
              <EmptyState
                icon={Rss}
                title="Henüz paylaşım yok"
                description="İlk paylaşımı siz yapın! Fotoğraf, video veya düşüncelerinizi paylaşarak topluluğa katılın."
                actionLabel="İlk Paylaşımı Yap"
                onAction={() => navigate("/profile")}
                illustration={<NoPostsIllustration />}
                variant="gradient"
              />
            ) : (
              <Virtuoso
                data={enrichedPosts}
                endReached={handleLoadMore}
                itemContent={(index, post) => (
                  <div key={post.id} className="mb-4">
                    {renderPost(post)}
                  </div>
                )}
                components={{
                  Footer: () => feedLoading ? (
                    <div className="py-8">
                      <LoadingSpinner size="md" text="Daha fazla gönderi yükleniyor..." />
                    </div>
                  ) : null
                }}
                style={{ height: '100vh' }}
                increaseViewportBy={{ top: 600, bottom: 600 }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Comments Dialog */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl">Yorumlar</DialogTitle>
            <DialogDescription>
              Bu gönderiye yapılan yorumları görüntüleyin ve yeni yorum ekleyin
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(85vh-180px)] px-6">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Henüz yorum yok
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  İlk yorumu siz yapın!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {comments.map(comment => renderComment(comment))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Reply className="w-3 h-3" />
                <span>Yanıtlanıyor</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 ml-auto"
                  onClick={() => setReplyingTo(null)}
                >
                  İptal
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={""} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  ME
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder={replyingTo ? "Yanıtınızı yazın..." : "Yorum yazın..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="icon"
                className="flex-shrink-0"
              >
                <Reply className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Arkadaşlarınla Paylaş</DialogTitle>
            <DialogDescription>
              Bu gönderiyi arkadaşlarınıza mesaj olarak gönderin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Henüz arkadaşınız yok</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFriends.has(friend.user_id)
                          ? "bg-primary/10 border-2 border-primary"
                          : "hover:bg-muted border-2 border-transparent"
                      }`}
                      onClick={() => toggleFriendSelection(friend.user_id)}
                    >
                      <Avatar>
                        <AvatarImage src={friend.profile_photo || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {friend.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {friend.full_name || friend.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                      {selectedFriends.has(friend.user_id) && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleShareToFriends}
                disabled={selectedFriends.size === 0}
                className="flex-1"
              >
                Gönder ({selectedFriends.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save to Collection Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kaydet</DialogTitle>
            <DialogDescription>
              Gönderiyi bir koleksiyona kaydedin veya koleksiyonsuz kaydedin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Koleksiyon seç (isteğe bağlı)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Koleksiyonsuz</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {collection.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => navigate("/saved")}
              variant="outline"
              className="w-full gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Yeni Koleksiyon Oluştur
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setPostToSave(null);
                  setSelectedCollection("");
                }}
                className="flex-1"
              >
                İptal
              </Button>
              <Button onClick={handleConfirmSave} className="flex-1">
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      {userId && username && (
        <Suspense fallback={<div />}>
          <LazyCreatePostDialog
            open={createPostOpen}
            onOpenChange={setCreatePostOpen}
            userId={userId}
            username={username}
            profilePhoto={profilePhoto}
            onPostCreated={() => {
              setCreatePostOpen(false);
              handleRefresh();
            }}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />

      {/* Onboarding Tour */}
      {shouldShowOnboarding && (
        <OnboardingTour
          steps={onboardingSteps}
          onComplete={markOnboardingComplete}
          onSkip={markOnboardingComplete}
          storageKey="feed-tour"
        />
      )}

      {/* Full Screen Media Viewer */}
      <Suspense fallback={<div />}>
        <LazyFullScreenMediaViewer
          open={mediaViewerOpen}
          onOpenChange={setMediaViewerOpen}
          media={selectedMedia}
          initialIndex={selectedMediaIndex}
          onLike={() => {
            const mediaUrl = selectedMedia[selectedMediaIndex]?.url;
            const post = enrichedPosts.find(p => 
              p.media_urls?.includes(mediaUrl) || p.media_url === mediaUrl
            );
            if (post && !post.hasLiked) {
              handleLike(post.id, false);
            }
          }}
          isLiked={(() => {
            const mediaUrl = selectedMedia[selectedMediaIndex]?.url;
            const post = enrichedPosts.find(p => 
              p.media_urls?.includes(mediaUrl) || p.media_url === mediaUrl
            );
            return post?.hasLiked || false;
          })()}
        />
      </Suspense>
    </div>
  );
};

export default Feed;