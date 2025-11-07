import { useState, memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, Heart, Share2, MapPin, Grid3x3, List, Play } from "lucide-react";
import { ParsedText } from "@/components/ParsedText";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { soundEffects } from "@/utils/soundEffects";
import { DoubleTapLike } from "@/components/DoubleTapLike";
import { FullScreenMediaViewer } from "@/components/FullScreenMediaViewer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PostReactionPicker } from "./PostReactionPicker";
import { OptimizedImage } from "./OptimizedImage";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  location_name: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  created_at: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  comments: number;
  hasLiked: boolean;
}

interface ProfilePostsProps {
  posts: Post[];
  loading: boolean;
  isOwnProfile: boolean;
  onLike?: (postId: string, hasLiked: boolean) => Promise<void>;
}

export const ProfilePosts = memo(({ posts, loading, isOwnProfile, onLike }: ProfilePostsProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "photo" | "video" }[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter posts with media for grid view
  const postsWithMedia = useMemo(() => 
    posts.filter(post => post.media_urls && post.media_urls.length > 0),
    [posts]
  );

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!hasLiked) {
      soundEffects.playLike();
    }
    if (onLike) {
      await onLike(postId, hasLiked);
    }
  };

  const openMediaViewer = (post: Post, index: number = 0) => {
    if (post.media_urls) {
      setSelectedMedia(post.media_urls.map((url, i) => ({ 
        url, 
        type: post.media_types?.[i] === "video" ? "video" : "photo" 
      })));
      setSelectedMediaIndex(index);
      setMediaViewerOpen(true);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-2">
            {isOwnProfile ? "Henüz gönderi paylaşmadınız" : "Henüz gönderi yok"}
          </p>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground">
              İlk gönderinizi oluşturmak için + butonuna tıklayın
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
          className="gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          Grid
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="gap-2"
        >
          <List className="w-4 h-4" />
          Liste
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-3 gap-1 sm:gap-2"
          >
            {postsWithMedia.map((post, index) => {
              const firstMedia = post.media_urls![0];
              const mediaType = post.media_types?.[0];
              const isVideo = mediaType === "video";

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  className="relative aspect-square overflow-hidden rounded-md group cursor-pointer"
                  onClick={() => openMediaViewer(post, 0)}
                >
                  {isVideo ? (
                    <>
                      <video 
                        src={firstMedia}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                        <Play className="w-4 h-4 text-white" fill="white" />
                      </div>
                    </>
                  ) : (
                    <OptimizedImage
                      src={firstMedia}
                      alt="Post"
                      className="w-full h-full group-hover:scale-110 transition-transform duration-300"
                      aspectRatio="1/1"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
                      quality={70}
                    />
                  )}
                  
                  {/* Multiple media indicator */}
                  {post.media_urls!.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                      <Grid3x3 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Hover overlay with stats */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <Heart className="w-5 h-5" fill="white" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <MessageCircle className="w-5 h-5" fill="white" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-3 sm:p-6">
              <div className="space-y-4">{posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 mb-4">
              <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar 
                    className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-border cursor-pointer hover:ring-primary transition-all"
                    onClick={() => post.profile.profile_photo && setSelectedImage(post.profile.profile_photo)}
                  >
                    <AvatarImage 
                      src={post.profile.profile_photo || undefined}
                      loading="lazy"
                      decoding="async"
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
                      {post.profile.full_name?.[0] || post.profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">{post.profile.full_name || post.profile.username}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                </div>
              </div>

            {post.content && (
              <div className="text-foreground whitespace-pre-wrap mb-3 text-xs sm:text-sm leading-relaxed">
                <ParsedText text={post.content} />
              </div>
            )}

            {/* Location */}
            {post.location_name && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hover:underline cursor-pointer">{post.location_name}</span>
              </div>
            )}
          </div>

          {/* Media Carousel */}
          {post.media_urls && post.media_urls.length > 0 && (
            <DoubleTapLike
              onDoubleTap={() => !post.hasLiked && handleLike(post.id, false)}
              isLiked={post.hasLiked}
              className="cursor-pointer"
            >
              {post.media_urls.length === 1 ? (
                <div 
                  className="w-full"
                  onClick={() => openMediaViewer(post, 0)}
                >
                  {post.media_types?.[0] === "photo" ? (
                    <OptimizedImage
                      src={post.media_urls[0]}
                      alt="Post media"
                      className="w-full max-h-[400px] sm:max-h-[500px]"
                      aspectRatio="16/9"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 800px"
                      quality={80}
                    />
                  ) : (
                    <video 
                      src={post.media_urls[0]} 
                      controls 
                      preload="metadata"
                      className="w-full max-h-[400px] sm:max-h-[500px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {post.media_urls.map((url, index) => (
                      <CarouselItem key={index}>
                      <div 
                        className="w-full"
                        onClick={() => openMediaViewer(post, index)}
                      >
                          {post.media_types?.[index] === "photo" ? (
                            <OptimizedImage
                              src={url}
                              alt={`Post media ${index + 1}`}
                              className="w-full max-h-[400px] sm:max-h-[500px]"
                              aspectRatio="16/9"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 800px"
                              quality={80}
                            />
                          ) : (
                            <video 
                              src={url} 
                              controls 
                              preload="metadata"
                              className="w-full max-h-[400px] sm:max-h-[500px]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {post.media_urls.length} fotoğraf
                  </div>
                </Carousel>
              )}
            </DoubleTapLike>
          )}

            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
                <span>{post.likes} beğeni</span>
                <span>{post.comments} yorum</span>
              </div>

              <Separator className="mb-2 sm:mb-3" />

              <div className="flex items-center justify-around gap-1">
                <PostReactionPicker
                  postId={post.id}
                  currentUserId={post.user_id}
                  onReactionChange={() => handleLike(post.id, post.hasLiked)}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Yorum</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Paylaş</span>
                </Button>
              </div>
            </div>
          </Card>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Media Viewer */}
      <FullScreenMediaViewer
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
        media={selectedMedia}
        initialIndex={selectedMediaIndex}
        onLike={() => {
          const mediaUrl = selectedMedia[selectedMediaIndex]?.url;
          const post = posts.find(p => 
            p.media_urls?.includes(mediaUrl)
          );
          if (post && !post.hasLiked) {
            handleLike(post.id, false);
          }
        }}
        isLiked={(() => {
          const mediaUrl = selectedMedia[selectedMediaIndex]?.url;
          const post = posts.find(p => 
            p.media_urls?.includes(mediaUrl)
          );
          return post?.hasLiked || false;
        })()}
      />
    </>
  );
});

ProfilePosts.displayName = "ProfilePosts";