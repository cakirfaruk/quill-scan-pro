import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "@/components/ParsedText";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  hasLiked: boolean;
  replies: Comment[];
}

interface FeedCommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onLike: (commentId: string, hasLiked: boolean) => void;
  onReply: (commentId: string) => void;
}

export const FeedCommentItem = memo(({ 
  comment, 
  isReply = false, 
  onLike, 
  onReply 
}: FeedCommentItemProps) => {
  const navigate = useNavigate();

  return (
    <div className={`${isReply ? 'ml-8 mt-2' : 'mt-4'} animate-fade-in`}>
      <div className="flex gap-3">
        <Avatar 
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={() => navigate(`/profile/${comment.user.username}`)}
        >
          <AvatarImage src={comment.user.profile_photo || undefined} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
            {comment.user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-2xl px-4 py-2">
            <p 
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${comment.user.username}`)}
            >
              {comment.user.full_name || comment.user.username}
            </p>
            <p className="text-sm mt-0.5">
              <ParsedText text={comment.content} />
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1 px-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}</span>
            <button
              className="hover:text-primary font-medium transition-colors"
              onClick={() => onLike(comment.id, comment.hasLiked)}
            >
              <Heart className={`w-3 h-3 inline mr-1 ${comment.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
              {comment.likes > 0 && comment.likes}
            </button>
            {!isReply && (
              <button
                className="hover:text-primary font-medium transition-colors"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="w-3 h-3 inline mr-1" />
                Yanıtla
              </button>
            )}
          </div>
          {comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map(reply => (
                <FeedCommentItem 
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FeedCommentItem.displayName = "FeedCommentItem";
