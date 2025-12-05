import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, MapPin, Trash2, Loader2, Repeat2, Quote, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "@/components/ParsedText";
import { DoubleTapLike } from "@/components/DoubleTapLike";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/OptimizedImage";
import { AnalysisPostCard } from "@/components/AnalysisPostCard";
import { EditPostDialog } from "@/components/EditPostDialog";
import { PostInsightsDialog } from "@/components/PostInsightsDialog";
import { SharedPostCard } from "@/components/SharedPostCard";

// Helper function to check if media type is an image
const isImageType = (type: string | undefined | null): boolean => {
  if (!type) return true; // Default to image if no type
  const imageTypes = ['image', 'photo', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  return imageTypes.some(t => type.toLowerCase().includes(t) || type.toLowerCase() === t);
};

// Helper function to check if media type is video
const isVideoType = (type: string | undefined | null): boolean => {
  if (!type) return false;
  return type.toLowerCase().includes('video');
};

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  created_at: string;
  shares_count: number;
  location_name?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  analysis_type?: string | null;
  analysis_data?: any;
  shared_post_id?: string | null;
  shared_post?: any;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasSaved: boolean;
  _optimistic?: boolean;
  _status?: 'pending' | 'syncing' | 'success' | 'failed';
}

interface FeedPostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string, hasLiked: boolean) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, hasSaved: boolean) => void;
  onDelete?: (postId: string) => void;
  onMediaClick: (media: { url: string; type: "photo" | "video" }[], index: number) => void;
  onRepost?: (post: Post) => void;
  onQuote?: (post: Post) => void;
  isLikeLoading?: boolean;
}

export const FeedPostCard = memo(({ 
  post,
  currentUserId,
  onLike, 
  onComment, 
  onShare, 
  onSave,
  onDelete,
  onMediaClick,
  onRepost,
  onQuote,
  isLikeLoading = false,
}: FeedPostCardProps) => {
  const navigate = useNavigate();
  const isOwnPost = currentUserId === post.user_id;
  const [localContent, setLocalContent] = useState(post.content);
  const [insightsOpen, setInsightsOpen] = useState(false);

  return (
    <ScrollReveal direction="up" delay={0}>
      <Card className="mb-4 sm:mb-6 overflow-hidden group hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] animate-fade-in border-border/50 hover:border-primary/20">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-transparent to-transparent group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500">
          <Avatar 
            className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate(`/profile/${post.profile.username}`)}
          >
            <AvatarImage 
              src={post.profile.profile_photo || undefined}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
              {post.profile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${post.profile.username}`)}
            >
              <p className="font-semibold text-sm sm:text-base truncate">
                {post.profile.full_name || post.profile.username}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
            </p>
            {post.location_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {post.location_name}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRepost && !isOwnPost && (
                <DropdownMenuItem onClick={() => onRepost(post)}>
                  <Repeat2 className="w-4 h-4 mr-2" />
                  Yeniden Paylaş
                </DropdownMenuItem>
              )}
              {onQuote && !isOwnPost && (
                <DropdownMenuItem onClick={() => onQuote(post)}>
                  <Quote className="w-4 h-4 mr-2" />
                  Alıntılayarak Paylaş
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onSave(post.id, post.hasSaved)}>
                <Bookmark className="w-4 h-4 mr-2" />
                {post.hasSaved ? "Kaydedilenlerden Kaldır" : "Kaydet"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(post)}>
                <Share2 className="w-4 h-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
              {isOwnPost && (
                <>
                  <DropdownMenuItem onClick={() => setInsightsOpen(true)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    İstatistikler
                  </DropdownMenuItem>
                  <EditPostDialog
                    postId={post.id}
                    currentContent={localContent || ""}
                    onUpdate={setLocalContent}
                  />
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(post.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Gönderiyi Sil
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {localContent && (
          <div className="px-3 sm:px-4 pb-3">
            <ParsedText text={localContent} />
          </div>
        )}

        {/* Analysis Post */}
        {post.analysis_type && post.analysis_data && (
          <div className="px-3 sm:px-4 pb-3">
            <AnalysisPostCard 
              analysisType={post.analysis_type}
              analysisData={post.analysis_data}
            />
          </div>
        )}

        {/* Quoted/Shared Post */}
        {post.shared_post_id && post.shared_post && (
          <div className="px-3 sm:px-4 pb-3">
            <SharedPostCard data={post.shared_post} />
          </div>
        )}

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <DoubleTapLike
            onDoubleTap={() => !post.hasLiked && onLike(post.id, false)}
            isLiked={post.hasLiked}
            className="cursor-pointer"
          >
            {post.media_urls.length === 1 ? (
              <div 
                className="relative overflow-hidden group/media"
                onClick={() => {
                  onMediaClick(post.media_urls!.map((url, i) => ({ 
                    url, 
                    type: isVideoType(post.media_types?.[i]) ? "video" : "photo" 
                  })), 0);
                }}
              >
                {isImageType(post.media_types?.[0]) ? (
                  <OptimizedImage
                    src={post.media_urls[0]}
                    alt="Post"
                    className="w-full max-h-96 sm:max-h-[500px]"
                    aspectRatio="16/9"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 800px"
                    quality={80}
                  />
                ) : isVideoType(post.media_types?.[0]) ? (
                  <video 
                    src={post.media_urls[0]} 
                    controls 
                    preload="metadata"
                    className="w-full max-h-96 sm:max-h-[500px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : null}
              </div>
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {post.media_urls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div 
                        className="relative overflow-hidden group/media"
                        onClick={() => {
                          onMediaClick(post.media_urls!.map((url, i) => ({ 
                            url, 
                            type: isVideoType(post.media_types?.[i]) ? "video" : "photo" 
                          })), index);
                        }}
                      >
                        {isImageType(post.media_types?.[index]) ? (
                          <OptimizedImage
                            src={url}
                            alt={`Post ${index + 1}`}
                            className="w-full max-h-96 sm:max-h-[500px]"
                            aspectRatio="16/9"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 600px, 800px"
                            quality={80}
                          />
                        ) : isVideoType(post.media_types?.[index]) ? (
                          <video 
                            src={url} 
                            controls 
                            preload="metadata"
                            className="w-full max-h-96 sm:max-h-[500px]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : null}
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

        {/* Actions */}
        <div className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              {post.shares_count}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isLikeLoading}
              className={`flex-1 gap-2 transition-all duration-300 hover:scale-105 active:scale-95 ${post.hasLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" : "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"} disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => onLike(post.id, post.hasLiked)}
            >
              {isLikeLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 transition-all duration-300 ${post.hasLiked ? "fill-red-500 animate-bounce-in" : "group-hover:scale-110"}`} />
              )}
              Beğen
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300 hover:scale-105 active:scale-95 dark:hover:bg-blue-950"
              onClick={() => onComment(post)}
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Yorum
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 hover:bg-green-50 hover:text-green-500 transition-all duration-300 hover:scale-105 active:scale-95 dark:hover:bg-green-950"
              onClick={() => onShare(post)}
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Paylaş
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-300 hover:scale-105 active:scale-95 dark:hover:bg-yellow-950"
              onClick={() => onSave(post.id, post.hasSaved)}
            >
              <Bookmark className={`w-5 h-5 transition-all duration-300 ${post.hasSaved ? "fill-yellow-600 text-yellow-600 animate-bounce-in" : "group-hover:scale-110"}`} />
              Kaydet
            </Button>
          </div>
        </div>

        {/* Post Insights Dialog */}
        {isOwnPost && (
          <PostInsightsDialog
            postId={post.id}
            isOpen={insightsOpen}
            onClose={() => setInsightsOpen(false)}
          />
        )}
      </Card>
    </ScrollReveal>
  );
});

FeedPostCard.displayName = "FeedPostCard";
