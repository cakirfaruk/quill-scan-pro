import { memo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "./ParsedText";
import { OptimizedImage } from "./OptimizedImage";
import { PostReactionPicker } from "./PostReactionPicker";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  shares_count: number;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

interface OptimizedPostCardProps {
  post: Post;
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasSaved: boolean;
  onLike: (postId: string, hasLiked: boolean) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, hasSaved: boolean) => void;
  onMoreOptions: (post: Post) => void;
}

/**
 * **OPTIMIZED POST CARD**
 * - Memoized to prevent unnecessary re-renders
 * - Lazy image loading
 * - Optimized callbacks
 */
export const OptimizedPostCard = memo(({
  post,
  likes,
  comments,
  hasLiked,
  hasSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  onMoreOptions,
}: OptimizedPostCardProps) => {
  // Memoized callbacks
  const handleLike = useCallback(() => {
    onLike(post.id, hasLiked);
  }, [post.id, hasLiked, onLike]);

  const handleComment = useCallback(() => {
    onComment(post);
  }, [post, onComment]);

  const handleShare = useCallback(() => {
    onShare(post);
  }, [post, onShare]);

  const handleSave = useCallback(() => {
    onSave(post.id, hasSaved);
  }, [post.id, hasSaved, onSave]);

  const handleMore = useCallback(() => {
    onMoreOptions(post);
  }, [post, onMoreOptions]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-border">
              <AvatarImage src={post.profile.profile_photo || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
                {post.profile.full_name?.[0] || post.profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-xs sm:text-sm">
                {post.profile.full_name || post.profile.username}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: tr 
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMore}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {post.content && (
          <div className="mb-3 text-xs sm:text-sm leading-relaxed">
            <ParsedText text={post.content} />
          </div>
        )}
      </div>

      {/* **LAZY LOADED IMAGE** */}
      {post.media_url && (
        <div className="w-full">
          {post.media_type === "photo" ? (
            <OptimizedImage
              src={post.media_url}
              alt="Post media"
              className="w-full max-h-[400px] sm:max-h-[500px] object-cover"
            />
          ) : (
            <video 
              src={post.media_url} 
              controls 
              className="w-full max-h-[400px] sm:max-h-[500px]"
              preload="metadata"
            />
          )}
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
          <span>{likes} beğeni</span>
          <span>{comments} yorum</span>
        </div>

        <Separator className="mb-2 sm:mb-3" />

        <div className="flex items-center justify-around gap-1">
          <PostReactionPicker
            postId={post.id}
            currentUserId={post.user_id}
            onReactionChange={handleLike}
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            onClick={handleComment}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Yorum</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Paylaş</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
            onClick={handleSave}
          >
            <Bookmark 
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                hasSaved ? "fill-primary text-primary" : ""
              }`} 
            />
            <span className="hidden sm:inline">Kaydet</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // **CUSTOM COMPARISON** - Sadece gerekli prop'lar değiştiğinde re-render
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.likes === nextProps.likes &&
    prevProps.comments === nextProps.comments &&
    prevProps.hasLiked === nextProps.hasLiked &&
    prevProps.hasSaved === nextProps.hasSaved
  );
});