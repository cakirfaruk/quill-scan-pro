import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, Home, Rss, Sparkles } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { soundEffects } from "@/utils/soundEffects";
import { StoriesBar } from "@/components/StoriesBar";
import { SkeletonPost } from "@/components/ui/enhanced-skeleton";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { WidgetDashboard } from "@/components/WidgetDashboard";
import { FeedList } from "@/components/feed/FeedList";
import { useFeedPosts } from "@/hooks/use-feed-posts";
import { usePostInteractions } from "@/hooks/use-post-interactions";
import { Post, Comment } from "@/types/feed";
import { CommentsDialog } from "@/components/feed/CommentsDialog";
import { ShareDialog } from "@/components/feed/ShareDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shouldShowOnboarding, markOnboardingComplete } = useOnboarding();
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // Custom Hooks
  const {
    friendsPosts,
    allPosts,
    friends,
    loading,
    hasMoreFriendsPosts,
    hasMoreAllPosts,
    loadPosts,
    updatePost
  } = useFeedPosts();

  const {
    handleLike,
    handleSave,
    saveDialogOpen,
    setSaveDialogOpen,
    postToSave,
    setPostToSave,
    // Note: handleConfirmSave logic was inside the hook locally or we need to extract the dialog too?
    // The hook in usePostInteractions.ts exposed saveDialogOpen states but not the confirm function?
    // Ah, I missed moving the confirm logic or exposing it. 
    // Let's implement the dialog in Feed.tsx and use variables from hook?
    // Wait, usePostInteractions returned state setters. I can implement the dialog here.
  } = usePostInteractions({ userId, updatePost });

  // Comment State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [collections, setCollections] = useState<any[]>([]); // simplified
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  useKeyboardShortcuts({
    onNewPost: () => {
      if (userId) setCreatePostOpen(true);
    },
    onSearch: () => {
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
          const searchButton = document.querySelector('button[class*="w-8 sm:w-9"]') as HTMLButtonElement;
          searchButton?.click();
        },
      },
    },
  ];

  const handleRefresh = useCallback(async () => {
    soundEffects.playClick();
    if (userId) {
      await loadPosts(userId, 1, true);
    }
  }, [userId, loadPosts]);

  const { containerRef, isPulling, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  useEffect(() => {
    checkUserAndLoad();
  }, []); // Run once on mount

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, profile_photo")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setUsername(profile.username);
      setProfilePhoto(profile.profile_photo);
    }

    await loadPosts(user.id, 1, true);
  };

  const handleLoadMoreFriends = useCallback(async () => {
    if (!userId || !hasMoreFriendsPosts) return;
    // Calculate page: current length / 20 + 1 (simplified, usually hook handles page)
    const nextPage = Math.ceil(friendsPosts.length / 20) + 1;
    await loadPosts(userId, nextPage, false);
  }, [userId, hasMoreFriendsPosts, friendsPosts.length, loadPosts]);

  const handleLoadMoreAll = useCallback(async () => {
    if (!userId || !hasMoreAllPosts) return;
    const nextPage = Math.ceil(allPosts.length / 20) + 1;
    await loadPosts(userId, nextPage, false);
  }, [userId, hasMoreAllPosts, allPosts.length, loadPosts]);

  const friendsInfiniteScroll = useInfiniteScroll({
    onLoadMore: handleLoadMoreFriends,
    hasMore: hasMoreFriendsPosts,
    isLoading: loading,
    threshold: 0.5,
    rootMargin: "200px",
  });

  const allPostsInfiniteScroll = useInfiniteScroll({
    onLoadMore: handleLoadMoreAll,
    hasMore: hasMoreAllPosts,
    isLoading: loading,
    threshold: 0.5,
    rootMargin: "200px",
  });

  // --- Comment Logic ---

  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
    setCommentsDialogOpen(true);
  };

  // --- Share Logic ---
  const handleOpenShareDialog = (post: Post) => {
    setPostToShare(post);
    setShareDialogOpen(true);
  };

  const handleShareComplete = () => {
    if (postToShare) {
      // Optimistically update the share count in the UI if needed, OR just reload
      // Since the dialog does the API call and update, we might just want to update local state field
      updatePost({
        ...postToShare,
        shares_count: (postToShare.shares_count || 0) + 1 // technically + count but dialog handles bulk
      });
      // Actually ShareDialog updates db, we should ideally fetch or just use what we know
      // For now, let's just null the post
      setPostToShare(null);
    }
  };

  // --- UI Render ---

  if (loading && friendsPosts.length === 0 && allPosts.length === 0) {
    return (
      <div className="min-h-screen bg-transparent pb-32">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
          {[1, 2, 3].map((i) => <SkeletonPost key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 relative">
      <Header />

      {/* Top Gradient Fade for Immersion */}
      <div className="fixed top-0 left-0 w-full h-32 bg-abyss-gradient pointer-events-none z-10" />

      <div ref={containerRef} className="container mx-auto px-0 sm:px-4 pt-6 max-w-2xl relative z-0">
        {/* Pull to Refresh */}
        {(isPulling || isRefreshing) && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 transform"
            style={{ transform: `translateX(-50%) translateY(${Math.min(pullDistance, 80)}px)` }}>
            <div className={`bg-primary text-primary-foreground rounded-full p-3 shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Dynamic Title */}
        <div className="px-4 sm:px-0 mb-6 flex justify-between items-end">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter neon-text animate-fade-in">
            Connect
          </h1>
        </div>

        {userId && (
          <ScrollReveal direction="down" delay={0.1}>
            <div className="mb-6 px-4 sm:px-0">
              <StoriesBar currentUserId={userId} />
            </div>
          </ScrollReveal>
        )}

        <Tabs defaultValue="friends" className="w-full">
          {/* Floating Sticky Tabs */}
          <div className="px-4 sm:px-0 sticky top-20 z-30 mb-8">
            <TabsList className="flex w-full bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-glass">
              <TabsTrigger value="friends" className="flex-1 rounded-full py-2.5 data-[state=active]:bg-primary/20 data-[state=active]:text-white font-semibold data-[state=active]:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300">
                Arkadaşlarım
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1 rounded-full py-2.5 data-[state=active]:bg-primary/20 data-[state=active]:text-white font-semibold data-[state=active]:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300">
                Keşfet
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="friends" className="mt-0 px-2 sm:px-0">
            <FeedList
              posts={friendsPosts}
              loading={loading}
              currentUserId={userId}
              type="friends"
              onLike={handleLike}
              onSave={handleSave}
              onComment={handleOpenComments}
              onShare={handleOpenShareDialog}
              hasMore={hasMoreFriendsPosts}
              infiniteScrollRef={friendsInfiniteScroll.sentinelRef}
              isLoadingMore={friendsInfiniteScroll.isLoadingMore}
            />
          </TabsContent>

          <TabsContent value="discover" className="mt-0 px-2 sm:px-0">
            <FeedList
              posts={allPosts}
              loading={loading}
              currentUserId={userId}
              type="discover"
              onLike={handleLike}
              onSave={handleSave}
              onComment={handleOpenComments}
              onShare={handleOpenShareDialog}
              hasMore={hasMoreAllPosts}
              infiniteScrollRef={allPostsInfiniteScroll.sentinelRef}
              isLoadingMore={allPostsInfiniteScroll.isLoadingMore}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        userId={userId}
        username={username}
        profilePhoto={profilePhoto}
        onPostCreated={() => loadPosts(userId, 1, true)}
      />

      <KeyboardShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />

      <CommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        post={selectedPost}
        currentUserId={userId}
        onCommentAdded={(postId) => {
          if (selectedPost) {
            updatePost({
              ...selectedPost,
              comments: selectedPost.comments + 1
            });
          }
        }}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        post={postToShare}
        currentUserId={userId}
        onShare={handleShareComplete}
      />

      {/* Save Collection Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="glass-panel border-white/10 rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-xl">Koleksiyona Kaydet</DialogTitle></DialogHeader>
          <div className="py-4 flex justify-center">
            <Button className="rounded-full px-8 bg-neon-gradient hover:scale-105 transition-transform" onClick={() => {
              soundEffects.playClick();
              supabase.from("saved_posts").insert({
                post_id: postToSave?.id,
                user_id: userId,
                collection_id: null
              }).then(() => {
                toast({ title: "Kaydedildi" });
                setSaveDialogOpen(false);
                setPostToSave(null);
                if (postToSave) updatePost({ ...postToSave, hasSaved: true });
              });
            }}>Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;