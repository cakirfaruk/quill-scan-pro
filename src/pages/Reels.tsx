import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSwipe } from "@/hooks/use-gestures";
import { Heart, MessageCircle, Share2, MoreVertical, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonReel } from "@/components/SkeletonReel";
import { SwipeableReelCard } from "@/components/SwipeableReelCard";
import { GestureIndicator } from "@/components/GestureIndicator";

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
  const [showGestureHint, setShowGestureHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const swipeHandlers = useSwipe({
    onSwipeUp: () => {
      if (currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    },
    onSwipeDown: () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    },
    threshold: 50,
  });

  useEffect(() => {
    loadReels();
    
    // Check if user has seen gesture hint
    const hasSeenGesture = localStorage.getItem("reels-gestures-seen");
    if (!hasSeenGesture) {
      setTimeout(() => {
        setShowGestureHint(true);
        localStorage.setItem("reels-gestures-seen", "true");
      }, 2000);
    }
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
      // Toggle like logic here
      toast({
        title: "Beğenildi!",
        description: "Video beğenildi.",
      });
    } catch (error: any) {
      console.error("Like error:", error);
    }
  };

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
      <div className="min-h-screen bg-black">
        <Header />
        <SkeletonReel />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-white p-8">
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
    <div className="min-h-screen bg-black">
      <Header />
      
      <div
        ref={containerRef}
        className="h-[calc(100vh-64px)] overflow-hidden snap-y snap-mandatory"
        {...swipeHandlers}
      >
        {reels.map((reel, index) => (
          <SwipeableReelCard
            key={reel.id}
            onSwipeUp={() => {
              if (currentIndex < reels.length - 1) {
                setCurrentIndex(prev => prev + 1);
              }
            }}
            onSwipeDown={() => {
              if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
              }
            }}
            onDoubleTap={() => handleLike(reel.id)}
          >
            <div
              className={cn(
                "h-full w-full snap-start relative",
                index === currentIndex ? "block" : "hidden md:block"
              )}
            >
            <VideoPlayer
              src={reel.video_url}
              thumbnail={reel.thumbnail_url}
              className="h-full w-full"
              autoPlay={index === currentIndex}
              loop
              muted={false}
              onViewTracked={index === currentIndex ? handleViewTracked : undefined}
            />

            {/* Overlay UI */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
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
                  <button
                    className="flex flex-col items-center gap-1 group"
                    onClick={() => handleLike(reel.id)}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className={cn(
                        "w-6 h-6 transition-colors",
                        reel.is_liked ? "fill-red-500 text-red-500" : "text-white"
                      )} />
                    </div>
                    <span className="text-xs text-white font-medium">
                      {reel.likes_count || 0}
                    </span>
                  </button>

                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-white font-medium">
                      {reel.comments_count || 0}
                    </span>
                  </button>

                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                  </button>

                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MoreVertical className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex gap-1">
                {reels.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      idx === currentIndex ? "bg-white" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          </SwipeableReelCard>
        ))}
      </div>

      {/* Gesture Indicator */}
      <GestureIndicator show={showGestureHint} type="double-tap" />
    </div>
  );
};

export default Reels;
