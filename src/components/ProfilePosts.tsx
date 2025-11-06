import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, Heart, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { soundEffects } from "@/utils/soundEffects";
import { DoubleTapLike } from "@/components/DoubleTapLike";
import { FullScreenMediaViewer } from "@/components/FullScreenMediaViewer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
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

export const ProfilePosts = ({ posts, loading, isOwnProfile, onLike }: ProfilePostsProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "photo" | "video" }[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!hasLiked) {
      soundEffects.playLike();
    }
    if (onLike) {
      await onLike(postId, hasLiked);
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
    <Card className="p-3 sm:p-6">
      <div className="space-y-4 sm:space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar 
                    className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-border cursor-pointer hover:ring-primary transition-all"
                    onClick={() => post.profile.profile_photo && setSelectedImage(post.profile.profile_photo)}
                  >
                    <AvatarImage src={post.profile.profile_photo || undefined} />
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
              <p className="text-foreground whitespace-pre-wrap mb-3 text-xs sm:text-sm leading-relaxed">{post.content}</p>
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
                  onClick={() => {
                    setSelectedMedia(post.media_urls!.map((url, i) => ({ 
                      url, 
                      type: post.media_types?.[i] === "video" ? "video" : "photo" 
                    })));
                    setSelectedMediaIndex(0);
                    setMediaViewerOpen(true);
                  }}
                >
                  {post.media_types?.[0] === "photo" ? (
                    <img 
                      src={post.media_urls[0]} 
                      alt="Post media" 
                      className="w-full max-h-[400px] sm:max-h-[500px] object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <video 
                      src={post.media_urls[0]} 
                      controls 
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
                          onClick={() => {
                            setSelectedMedia(post.media_urls!.map((url, i) => ({ 
                              url, 
                              type: post.media_types?.[i] === "video" ? "video" : "photo" 
                            })));
                            setSelectedMediaIndex(index);
                            setMediaViewerOpen(true);
                          }}
                        >
                          {post.media_types?.[index] === "photo" ? (
                            <img 
                              src={url} 
                              alt={`Post media ${index + 1}`} 
                              className="w-full max-h-[400px] sm:max-h-[500px] object-cover transition-transform duration-300"
                            />
                          ) : (
                            <video 
                              src={url} 
                              controls 
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={() => handleLike(post.id, post.hasLiked)}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110 ${post.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <span className="hidden sm:inline">Beğen</span>
                </Button>
                
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
    </Card>
  );
};