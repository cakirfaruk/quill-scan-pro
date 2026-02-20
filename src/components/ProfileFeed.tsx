import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/PostCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageCircle, Reply, Heart, Share2, Bookmark, UserPlus, Users, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "@/components/ParsedText";
import { useNavigate } from "react-router-dom";
import { soundEffects } from "@/utils/soundEffects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileFeedProps {
    userId: string;
    isOwnProfile: boolean;
}

export const ProfileFeed = ({ userId, isOwnProfile }: ProfileFeedProps) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Dialog States
    const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [selectedPostForSave, setSelectedPostForSave] = useState<any>(null);
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>("");

    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
        loadPosts();
    }, [userId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadPosts = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentId = user?.id;

            const [postsResult, userLikesResult, savedResult] = await Promise.all([
                supabase
                    .from("posts")
                    .select(`
                        id, user_id, content, media_url, media_type, created_at, shares_count, likes_count, comments_count,
                        profiles!posts_user_id_fkey (
                          username,
                          full_name,
                          profile_photo
                        )
                    `)
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false }),
                currentId ? supabase.from("post_likes").select("post_id").eq("user_id", currentId) : Promise.resolve({ data: [] }),
                currentId ? supabase.from("saved_posts").select("post_id").eq("user_id", currentId) : Promise.resolve({ data: [] })
            ]);

            if (postsResult.data) {
                const userLikesSet = new Set(userLikesResult.data?.map((l: any) => l.post_id) || []);
                const savedSet = new Set(savedResult.data?.map((s: any) => s.post_id) || []);

                const formattedPosts = postsResult.data.map((post: any) => ({
                    ...post,
                    profile: post.profiles,
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    hasLiked: userLikesSet.has(post.id),
                    hasSaved: savedSet.has(post.id)
                }));

                setPosts(formattedPosts);
            }
        } catch (error) {
            console.error("Error loading profile posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId: string, hasLiked: boolean) => {
        if (!currentUserId) return;

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    hasLiked: !hasLiked,
                    likes: hasLiked ? p.likes - 1 : p.likes + 1
                };
            }
            return p;
        }));

        if (!hasLiked) soundEffects.playLike();

        try {
            if (hasLiked) {
                await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
            } else {
                await supabase.from("post_likes").insert({ post_id: postId, user_id: currentUserId });
            }
        } catch (error) {
            console.error("Like error:", error);
            loadPosts(); // Revert on error
        }
    };

    const handleOpenComments = async (post: any) => {
        setSelectedPostForComments(post);
        setCommentsDialogOpen(true);

        const { data } = await supabase
            .from("post_comments")
            .select(`
        *,
        user:profiles!post_comments_user_id_fkey (
          username,
          full_name,
          profile_photo
        ),
        replies:post_comments!parent_id (
          *,
          user:profiles!post_comments_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        )
      `)
            .eq("post_id", post.id)
            .is("parent_id", null)
            .order("created_at", { ascending: true });

        if (data) {
            // Fetch likes for comments
            const commentIds = data.flatMap((c: any) => [c.id, ...(c.replies?.map((r: any) => r.id) || [])]);
            if (currentUserId && commentIds.length > 0) {
                const { data: likes } = await supabase
                    .from("comment_likes")
                    .select("comment_id")
                    .eq("user_id", currentUserId)
                    .in("comment_id", commentIds);

                const likedSet = new Set(likes?.map((l: any) => l.comment_id));

                // Fetch like counts
                const { data: likeCounts } = await supabase
                    .from("comment_likes")
                    .select("comment_id")
                    .in("comment_id", commentIds);

                const countMap = new Map();
                likeCounts?.forEach((l: any) => countMap.set(l.comment_id, (countMap.get(l.comment_id) || 0) + 1));

                const formatComments = (list: any[]) => list.map(c => ({
                    ...c,
                    hasLiked: likedSet.has(c.id),
                    likes: countMap.get(c.id) || 0,
                    replies: c.replies ? formatComments(c.replies) : []
                }));

                setComments(formatComments(data));
            } else {
                setComments(data.map((c: any) => ({ ...c, hasLiked: false, likes: 0, replies: c.replies || [] })));
            }
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPostForComments || !currentUserId) return;

        try {
            const { error } = await supabase
                .from("post_comments")
                .insert({
                    post_id: selectedPostForComments.id,
                    user_id: currentUserId,
                    content: newComment,
                    parent_id: replyingTo
                });

            if (error) throw error;

            setNewComment("");
            setReplyingTo(null);
            handleOpenComments(selectedPostForComments);
            setPosts(prev => prev.map(p => p.id === selectedPostForComments.id ? { ...p, comments: p.comments + 1 } : p));

            toast({ title: "Yorum gönderildi" });
        } catch (error) {
            toast({ title: "Hata", description: "Yorum gönderilemedi", variant: "destructive" });
        }
    };

    const handleOpenShareDialog = async (post: any) => {
        setSelectedPostForShare(post);
        setShareDialogOpen(true);
        if (friends.length === 0 && currentUserId) {
            const { data } = await supabase
                .from("friends")
                .select(`
            friend_id,
            friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
          `)
                .eq("user_id", currentUserId)
                .eq("status", "accepted");

            if (data) {
                setFriends(data.map((f: any) => f.friend_profile));
            }
        }
    };

    const handleShareToFriends = async () => {
        if (!selectedPostForShare || selectedFriends.size === 0 || !currentUserId) return;

        try {
            const timestamp = new Date().toISOString();
            const notifications = Array.from(selectedFriends).map(friendId => ({
                user_id: friendId,
                type: 'share_post',
                content: {
                    postId: selectedPostForShare.id,
                    preview: selectedPostForShare.content?.substring(0, 50) || 'Bir gönderi paylaştı'
                },
                sender_id: currentUserId,
                created_at: timestamp
            }));

            // Here we would typically insert into a notifications table or messages
            // For now simulating success
            toast({ title: "Başarılı", description: `${selectedFriends.size} kişiye gönderildi` });
            setShareDialogOpen(false);
            setSelectedFriends(new Set());
        } catch (error) {
            toast({ title: "Hata", description: "Paylaşılamadı", variant: "destructive" });
        }
    };

    const handleSave = async (postId: string, hasSaved: boolean) => {
        if (hasSaved) {
            // If already saved, unsave directly
            try {
                if (currentUserId) {
                    await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", currentUserId);
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, hasSaved: false } : p));
                    toast({ title: "Kaydedilenlerden kaldırıldı" });
                }
            } catch (e) { console.error(e); }
        } else {
            // Open save dialog
            setSelectedPostForSave(posts.find(p => p.id === postId));
            setSaveDialogOpen(true);
            // Load collections
            if (currentUserId && collections.length === 0) {
                const { data } = await supabase.from("collections").select("id, name").eq("user_id", currentUserId);
                if (data) setCollections(data);
            }
        }
    };

    const handleConfirmSave = async () => {
        if (!selectedPostForSave || !currentUserId) return;
        try {
            await supabase.from("saved_posts").insert({
                user_id: currentUserId,
                post_id: selectedPostForSave.id,
                collection_id: selectedCollection || null
            });
            setPosts(prev => prev.map(p => p.id === selectedPostForSave.id ? { ...p, hasSaved: true } : p));
            toast({ title: "Kaydedildi" });
            setSaveDialogOpen(false);
            setSelectedCollection("");
        } catch (error) {
            toast({ title: "Hata", description: "Kaydedilemedi", variant: "destructive" });
        }
    };

    const renderComment = (comment: any, isReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
            <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user.profile_photo} />
                    <AvatarFallback>{comment.user.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl px-4 py-2">
                        <p className="font-semibold text-sm">{comment.user.full_name || comment.user.username}</p>
                        <p className="text-sm"><ParsedText text={comment.content} /></p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}</span>
                        {!isReply && <button onClick={() => setReplyingTo(comment.id)} className="hover:text-primary">Yanıtla</button>}
                    </div>
                    {comment.replies?.map((r: any) => renderComment(r, true))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg mb-2">
                    {isOwnProfile ? "Henüz gönderi paylaşmadınız" : "Henüz gönderi yok"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId || ""}
                    onLike={handleLike}
                    onComment={handleOpenComments}
                    onShare={handleOpenShareDialog}
                    onSave={handleSave}
                />
            ))}

            {/* Comments Dialog */}
            <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Yorumlar</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-4">
                        {comments.length === 0 ? <p className="text-center text-muted-foreground py-8">Henüz yorum yok</p> : comments.map(c => renderComment(c))}
                    </ScrollArea>
                    <div className="p-4 border-t bg-background mt-auto">
                        {replyingTo && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                <span>Yanıtlanıyor...</span>
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-4 p-0">İptal</Button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Yorum yap..."
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                            />
                            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                                <Reply className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Paylaş</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {friends.map(friend => (
                                <div
                                    key={friend.user_id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedFriends.has(friend.user_id) ? 'bg-primary/20' : 'hover:bg-muted'}`}
                                    onClick={() => {
                                        const newSet = new Set(selectedFriends);
                                        if (newSet.has(friend.user_id)) newSet.delete(friend.user_id);
                                        else newSet.add(friend.user_id);
                                        setSelectedFriends(newSet);
                                    }}
                                >
                                    <Avatar className="w-8 h-8"><AvatarImage src={friend.profile_photo} /><AvatarFallback>{friend.username[0]}</AvatarFallback></Avatar>
                                    <span>{friend.username}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleShareToFriends} className="w-full" disabled={selectedFriends.size === 0}>Gönder</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Kaydet</DialogTitle></DialogHeader>
                    <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                        <SelectTrigger><SelectValue placeholder="Koleksiyon seç (isteğe bağlı)" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Koleksiyonsuz</SelectItem>
                            {collections.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleConfirmSave} className="w-full mt-4">Kaydet</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
};
