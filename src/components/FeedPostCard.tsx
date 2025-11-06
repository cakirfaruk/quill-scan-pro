import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "@/components/ParsedText";
import { DoubleTapLike } from "@/components/DoubleTapLike";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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

interface FeedPostCardProps {
  post: Post;
  onLike: (postId: string, hasLiked: boolean) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, hasSaved: boolean) => void;
  onMediaClick: (media: { url: string; type: "photo" | "video" }[], index: number) => void;
}

export const FeedPostCard = memo(({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onSave,
  onMediaClick 
}: FeedPostCardProps) => {
  const navigate = useNavigate();

  return (
    <ScrollReveal direction="up" delay={0}>
      <Card className="mb-4 sm:mb-6 overflow-hidden group hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] animate-fade-in border-border/50 hover:border-primary/20">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-transparent to-transparent group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500">
          <Avatar 
            className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate(`/profile/${post.profile.username}`)}
          >
            <AvatarImage src={post.profile.profile_photo || undefined} />
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
              <DropdownMenuItem onClick={() => onSave(post.id, post.hasSaved)}>
                <Bookmark className="w-4 h-4 mr-2" />
                {post.hasSaved ? "Kaydedilenlerden Kaldır" : "Kaydet"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(post)}>
                <Share2 className="w-4 h-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-3 sm:px-4 pb-3">
            <ParsedText text={post.content} />
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
                    type: post.media_types?.[i] === "video" ? "video" : "photo" 
                  })), 0);
                }}
              >
                {post.media_types?.[0] === "image" || post.media_types?.[0] === "photo" ? (
                  <img 
                    src={post.media_urls[0]} 
                    alt="Post" 
                    className="w-full object-cover max-h-96 sm:max-h-[500px] transition-transform duration-700 group-hover/media:scale-105"
                  />
                ) : post.media_types?.[0] === "video" ? (
                  <video 
                    src={post.media_urls[0]} 
                    controls 
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
                            type: post.media_types?.[i] === "video" ? "video" : "photo" 
                          })), index);
                        }}
                      >
                        {post.media_types?.[index] === "image" || post.media_types?.[index] === "photo" ? (
                          <img 
                            src={url} 
                            alt={`Post ${index + 1}`} 
                            className="w-full object-cover max-h-96 sm:max-h-[500px] transition-transform duration-700"
                          />
                        ) : post.media_types?.[index] === "video" ? (
                          <video 
                            src={url} 
                            controls 
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
              className={`flex-1 gap-2 transition-all duration-300 hover:scale-105 active:scale-95 ${post.hasLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" : "hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"}`}
              onClick={() => onLike(post.id, post.hasLiked)}
            >
              <Heart className={`w-5 h-5 transition-all duration-300 ${post.hasLiked ? "fill-red-500 animate-bounce-in" : "group-hover:scale-110"}`} />
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
      </Card>
    </ScrollReveal>
  );
});

FeedPostCard.displayName = "FeedPostCard";
