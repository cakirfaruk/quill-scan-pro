import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Reply, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ParsedText } from "@/components/ParsedText";
import { Post, Comment } from "@/types/feed";
import { soundEffects } from "@/utils/soundEffects";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface CommentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post | null;
    currentUserId: string;
    onCommentAdded: (postId: string) => void;
}

export const CommentsDialog = ({
    open,
    onOpenChange,
    post,
    currentUserId,
    onCommentAdded
}: CommentsDialogProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && post) {
            loadComments(post.id);
        } else {
            setComments([]);
            setNewComment("");
            setReplyingTo(null);
        }
    }, [open, post]);

    const loadComments = async (postId: string) => {
        try {
            setLoading(true);
            const [commentsResult, likesResult, userLikesResult] = await Promise.all([
                supabase.from("post_comments")
                    .select(`*, profiles!post_comments_user_id_fkey(username, full_name, profile_photo)`)
                    .eq("post_id", postId)
                    .order("created_at", { ascending: true }),
                supabase.from("comment_likes").select("comment_id"),
                supabase.from("comment_likes").select("comment_id").eq("user_id", currentUserId)
            ]);

            if (commentsResult.error) throw commentsResult.error;

            const likesMap = new Map();
            likesResult.data?.forEach(l => likesMap.set(l.comment_id, (likesMap.get(l.comment_id) || 0) + 1));
            const userLikesSet = new Set(userLikesResult.data?.map(l => l.comment_id));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const commentsWithLikes = (commentsResult.data || []).map((c: any) => ({
                ...c,
                user: c.profiles,
                likes: likesMap.get(c.id) || 0,
                hasLiked: userLikesSet.has(c.id),
                replies: []
            }));

            const parentComments = commentsWithLikes.filter((c: Comment) => !c.parent_comment_id);
            const childComments = commentsWithLikes.filter((c: Comment) => c.parent_comment_id);

            parentComments.forEach((parent: Comment) => {
                parent.replies = childComments.filter((child: Comment) => child.parent_comment_id === parent.id);
            });

            setComments(parentComments);
        } catch (error) {
            console.error("Error loading comments:", error);
            toast({ title: "Hata", description: "Yorumlar yüklenemedi", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!post || !newComment.trim()) return;

        try {
            soundEffects.playMessageSent();
            const { error } = await supabase.from("post_comments").insert({
                post_id: post.id,
                user_id: currentUserId,
                content: newComment.trim(),
                parent_comment_id: replyingTo,
            });

            if (error) throw error;

            setNewComment("");
            setReplyingTo(null);
            await loadComments(post.id);
            onCommentAdded(post.id);

        } catch (error: any) {
            console.error("Comment submission error:", error);
            soundEffects.playError();
            toast({
                title: "Hata",
                description: `Yorum eklenemedi: ${error.message || error.details || "Bilinmeyen hata"}`,
                variant: "destructive"
            });
        }
    };

    const handleCommentLike = async (commentId: string, hasLiked: boolean) => {
        try {
            if (hasLiked) {
                await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", currentUserId);
            } else {
                soundEffects.playLike();
                await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: currentUserId });
            }
            if (post) await loadComments(post.id);
        } catch (error) {
            console.error(error);
        }
    };

    const renderCommentItem = (comment: Comment, isReply: boolean = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'} animate-fade-in`}>
            <div className="flex gap-3">
                <Avatar onClick={() => navigate(`/profile/${comment.user.username}`)} className="cursor-pointer w-8 h-8">
                    <AvatarImage src={comment.user.profile_photo || undefined} />
                    <AvatarFallback>{comment.user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-muted rounded-2xl px-4 py-2">
                        <p className="font-semibold text-sm cursor-pointer" onClick={() => navigate(`/profile/${comment.user.username}`)}>
                            {comment.user.full_name || comment.user.username}
                        </p>
                        <div className="text-sm mt-0.5"><ParsedText text={comment.content} /></div>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}</span>
                        <button onClick={() => handleCommentLike(comment.id, comment.hasLiked)} className="hover:text-primary flex items-center gap-1">
                            <Heart className={`w-3 h-3 ${comment.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                            {comment.likes > 0 && comment.likes}
                        </button>
                        {!isReply && (
                            <button onClick={() => setReplyingTo(comment.id)} className="hover:text-primary flex items-center gap-1">
                                <Reply className="w-3 h-3" /> Yanıtla
                            </button>
                        )}
                    </div>
                    {comment.replies?.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {comment.replies.map(reply => renderCommentItem(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="p-4 border-b border-white/10">
                    <DialogTitle>Yorumlar</DialogTitle>
                    <DialogDescription>Düşüncelerini paylaş</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading && comments.length === 0 ? (
                        <div className="py-8"><LoadingSpinner text="Yorumlar yükleniyor..." /></div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">Henüz yorum yok. İlk yorumu sen yap!</div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(c => renderCommentItem(c))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm">
                    {replyingTo && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Yanıtlanıyor...</span>
                            <button onClick={() => setReplyingTo(null)} className="hover:text-primary">İptal</button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Yorum yap..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            className="bg-muted/50 border-white/10"
                            disabled={loading}
                        />
                        <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim() || loading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
