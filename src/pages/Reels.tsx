import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSwipe } from "@/hooks/use-gestures";
import { Heart, MessageCircle, Share2, MoreVertical, Music, Volume2, VolumeX, Maximize, Minimize, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonReel } from "@/components/SkeletonReel";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string;
  title: string;
  description: string | null;
  created_at: string;
  user?: {
    username: string;
    profile_photo: string;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"up" | "down" | null>(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const swipeHandlers = useSwipe({
    onSwipeUp: () => {
      if (currentIndex < reels.length - 1) {
        setSwipeDirection("up");
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSwipeDirection(null);
        }, 150);
      }
    },
    onSwipeDown: () => {
      if (currentIndex > 0) {
        setSwipeDirection("down");
        setTimeout(() => {
          setCurrentIndex(prev => prev - 1);
          setSwipeDirection(null);
        }, 150);
      }
    },
    threshold: 50,
  });

  useEffect(() => {
    loadReels();
  }, []);

  useEffect(() => {
    // Scroll to current reel
    if (containerRef.current) {
      const reelElements = containerRef.current.children;
      if (reelElements[currentIndex]) {
        reelElements[currentIndex].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [currentIndex]);

  const loadReels = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Get friends' reels and own reels
      const { data: friendsData } = await supabase
        .from("friends")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      const friendIds = friendsData?.map(f =>
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      const userIds = [user.id, ...friendIds];

      // Get only reels posts (post_type='reels')
      const { data: reelsData, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            profile_photo
          )
        `)
        .in("user_id", userIds)
        .eq("post_type", "reels")
        .eq("media_type", "video")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reelsWithData = reelsData?.map(post => ({
        id: post.id,
        user_id: post.user_id,
        video_url: post.media_url || "",
        thumbnail_url: "", // posts don't have thumbnails, can be added later if needed
        title: post.content || "",
        description: post.content,
        created_at: post.created_at,
        user: {
          username: post.profiles?.username || "Unknown",
          profile_photo: post.profiles?.profile_photo || "",
        },
      })) || [];

      setReels(reelsWithData);
    } catch (error: any) {
      console.error("Error loading reels:", error);
      toast({
        title: "Hata",
        description: "Reels yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!currentUserId) return;

    try {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1000);

      const { data: existingLike } = await supabase
        .from("likes" as any)
        .select("*")
        .eq("post_id", reelId)
        .eq("user_id", currentUserId)
        .single();

      if (existingLike) {
        await supabase
          .from("likes" as any)
          .delete()
          .eq("post_id", reelId)
          .eq("user_id", currentUserId);

        setReels(prev => prev.map(r => 
          r.id === reelId 
            ? { ...r, is_liked: false, likes_count: (r.likes_count || 1) - 1 }
            : r
        ));
      } else {
        await supabase.from("likes" as any).insert({
          post_id: reelId,
          user_id: currentUserId,
        });

        setReels(prev => prev.map(r => 
          r.id === reelId 
            ? { ...r, is_liked: true, likes_count: (r.likes_count || 0) + 1 }
            : r
        ));
      }
    } catch (error: any) {
      console.error("Like error:", error);
      toast({
        title: "Hata",
        description: "Beğeni kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const loadComments = async (reelId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments" as any)
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("post_id", reelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleOpenComments = (reelId: string) => {
    setShowComments(true);
    loadComments(reelId);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentUserId) return;

    setIsSubmittingComment(true);
    try {
      const currentReel = reels[currentIndex];
      const { error } = await supabase.from("comments" as any).insert({
        post_id: currentReel.id,
        user_id: currentUserId,
        content: commentText,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Yorum eklendi",
      });

      setCommentText("");
      loadComments(currentReel.id);
      
      setReels(prev => prev.map(r => 
        r.id === currentReel.id 
          ? { ...r, comments_count: (r.comments_count || 0) + 1 }
          : r
      ));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yorum eklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleViewTracked = async (duration: number) => {
    if (!currentUserId) return;
    const currentReel = reels[currentIndex];
    if (!currentReel) return;

    try {
      await supabase.from("video_views").insert({
        video_id: currentReel.id,
        viewer_id: currentUserId,
        watch_duration: Math.round(duration),
      });
    } catch (error) {
      console.error("View tracking error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container-mobile bg-black">
        <Header />
        <SkeletonReel />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="page-container-mobile bg-black">
        <Header />
        <div className="flex flex-col items-center justify-center py-12 text-white p-8">
          <Music className="w-16 h-16 mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Henüz Video Yok</h2>
          <p className="text-muted-foreground text-center">
            Arkadaşlarınız henüz video paylaşmamış.
          </p>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div className={cn("bg-black", isFullscreen ? "fixed inset-0 z-50" : "page-container-mobile")}>
      {!isFullscreen && <Header />}
      
      <div
        ref={containerRef}
        className={cn(
          "overflow-hidden snap-y snap-mandatory",
          isFullscreen ? "h-screen" : "h-[calc(100vh-64px)]"
        )}
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait">
          {reels.map((reel, index) => {
            if (index !== currentIndex) return null;
            
            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: swipeDirection === "up" ? 100 : swipeDirection === "down" ? -100 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: swipeDirection === "up" ? -100 : swipeDirection === "down" ? 100 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full w-full snap-start relative"
              >
                <VideoPlayer
                  src={reel.video_url}
                  thumbnail={reel.thumbnail_url}
                  className="h-full w-full"
                  autoPlay={true}
                  loop
                  muted={isMuted}
                  onViewTracked={handleViewTracked}
                  reelsMode={true}
                />

                {/* Like Animation */}
                <AnimatePresence>
                  {likeAnimation && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                    >
                      <Heart className="w-32 h-32 fill-red-500 text-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top Controls */}
                <div className="absolute top-4 right-4 z-40 flex flex-col gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFullscreen}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize className="w-5 h-5 text-white" />
                    )}
                  </motion.button>
                </div>

                {/* Overlay UI */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="flex items-end justify-between">
                {/* Left side - User info and caption */}
                <div className="flex-1 space-y-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate(`/profile/${reel.user?.username}`)}
                  >
                    <Avatar className="w-12 h-12 border-2 border-white group-hover:scale-110 transition-transform">
                      <AvatarImage src={reel.user?.profile_photo} />
                      <AvatarFallback className="bg-primary">
                        {reel.user?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">@{reel.user?.username}</p>
                      <p className="text-sm text-white/80">{reel.title}</p>
                    </div>
                  </div>

                  {reel.description && (
                    <p className="text-sm text-white line-clamp-2">
                      {reel.description}
                    </p>
                  )}
                </div>

                    {/* Right side - Action buttons */}
                    <div className="flex flex-col items-center gap-6 ml-4">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="flex flex-col items-center gap-1 group"
                        onClick={() => handleLike(reel.id)}
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500/30 to-red-500/30 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-lg">
                          <Heart className={cn(
                            "w-7 h-7 transition-all",
                            reel.is_liked ? "fill-red-500 text-red-500 scale-110" : "text-white"
                          )} />
                        </div>
                        <span className="text-sm text-white font-bold drop-shadow-lg">
                          {reel.likes_count || 0}
                        </span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="flex flex-col items-center gap-1 group"
                        onClick={() => handleOpenComments(reel.id)}
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-lg">
                          <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-sm text-white font-bold drop-shadow-lg">
                          {reel.comments_count || 0}
                        </span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-lg">
                          <Share2 className="w-7 h-7 text-white" />
                        </div>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-lg">
                          <MoreVertical className="w-7 h-7 text-white" />
                        </div>
                      </motion.button>
                    </div>
              </div>

                  {/* Progress indicator */}
                  <div className="mt-4 flex gap-1.5">
                    {reels.map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: idx === currentIndex ? 1 : 0.8 }}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all",
                          idx === currentIndex ? "bg-primary shadow-lg shadow-primary/50" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Yorumlar
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Henüz yorum yok</p>
                <p className="text-sm">İlk yorumu sen yap!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.profile_photo} />
                    <AvatarFallback>
                      {comment.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-secondary rounded-2xl px-4 py-2">
                      <p className="font-semibold text-sm">
                        {comment.profiles?.full_name || comment.profiles?.username}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-4">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t px-6 py-4 bg-background">
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Yorum yaz..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
                size="icon"
              >
                {isSubmittingComment ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reels;
