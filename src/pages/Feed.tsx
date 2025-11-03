import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Heart, MessageCircle, Share2, MoreHorizontal, Reply, Loader2, RefreshCw, Bookmark, Folder, FolderPlus } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { soundEffects } from "@/utils/soundEffects";
import { StoriesBar } from "@/components/StoriesBar";
import { SkeletonPost } from "@/components/ui/enhanced-skeleton";
import { ParsedText } from "@/components/ParsedText";

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
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasSaved: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user_id: string;
  user: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  hasLiked: boolean;
  replies: Comment[];
}

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const handleRefresh = async () => {
    soundEffects.playClick();
    if (userId) {
      await loadPosts(userId);
    }
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setUserId(user.id);
    
    // **PARALEL YÜKLEME** - Arkadaşlar ve postlar aynı anda
    await Promise.all([
      loadFriends(user.id),
      loadPosts(user.id)
    ]);
  };

  const loadFriends = async (currentUserId: string) => {
    try {
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          user_id,
          friend_id,
          user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq("status", "accepted");

      if (!friendsData) return;

      const friendsList: Friend[] = friendsData.map((f: any) => {
        const isSender = f.user_id === currentUserId;
        const profile = isSender ? f.friend_profile : f.user_profile;
        return {
          user_id: profile.user_id,
          username: profile.username,
          full_name: profile.full_name,
          profile_photo: profile.profile_photo,
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const loadPosts = async (currentUserId: string) => {
    try {
      // **PARALEL SORGULAR** - Tek seferde tüm verileri al
      const [postsResult, friendsResult, likesResult, commentsCountResult, userLikesResult, userSavesResult] = await Promise.all([
        // 1. Postları çek
        supabase
          .from("posts")
          .select(`
            *,
            profiles!posts_user_id_fkey (
              username,
              full_name,
              profile_photo
            )
          `)
          .order("created_at", { ascending: false })
          .limit(100),
        
        // 2. Arkadaşları çek
        supabase
          .from("friends")
          .select("user_id, friend_id")
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
          .eq("status", "accepted"),
        
        // 3. TÜM postların like sayılarını tek sorguda al
        supabase
          .from("post_likes")
          .select("post_id"),
        
        // 4. TÜM postların yorum sayılarını tek sorguda al
        supabase
          .from("post_comments")
          .select("post_id"),
        
        // 5. Kullanıcının like'larını tek sorguda al
        supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", currentUserId),
        
        // 6. Kullanıcının kayıtlarını tek sorguda al
        supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", currentUserId)
      ]);

      if (postsResult.error) throw postsResult.error;

      // Like ve comment sayılarını grupla
      const likesMap = new Map<string, number>();
      (likesResult.data || []).forEach(like => {
        likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
      });

      const commentsMap = new Map<string, number>();
      (commentsCountResult.data || []).forEach(comment => {
        commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1);
      });

      const userLikesSet = new Set(userLikesResult.data?.map(l => l.post_id) || []);
      const userSavesSet = new Set(userSavesResult.data?.map(s => s.post_id) || []);

      // Postları enrich et
      const postsWithData = (postsResult.data || []).map((post: any) => ({
        ...post,
        profile: post.profiles,
        likes: likesMap.get(post.id) || 0,
        comments: commentsMap.get(post.id) || 0,
        hasLiked: userLikesSet.has(post.id),
        hasSaved: userSavesSet.has(post.id),
        shares_count: post.shares_count || 0,
      }));

      // Arkadaş ID'lerini hesapla
      const friendIds = new Set(
        (friendsResult.data || []).map(f => 
          f.user_id === currentUserId ? f.friend_id : f.user_id
        )
      );

      const friendsPosts = postsWithData.filter(post => 
        friendIds.has(post.user_id) || post.user_id === currentUserId
      );

      setFriendsPosts(friendsPosts);
      setAllPosts(postsWithData);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast({
        title: "Hata",
        description: "Paylaşımlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    try {
      if (hasLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      } else {
        soundEffects.playLike();
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      }
      await loadPosts(userId);
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
    }
  };

  const handleSave = async (postId: string, hasSaved: boolean) => {
    if (hasSaved) {
      try {
        await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
        toast({ title: "Kaydedildi", description: "Gönderi kaydedilenlerden kaldırıldı" });
        await loadPosts(userId);
      } catch (error: any) {
        soundEffects.playError();
        toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
      }
    } else {
      // Open dialog to select collection
      const post = [...friendsPosts, ...allPosts].find(p => p.id === postId);
      if (post) {
        setPostToSave(post);
        setSaveDialogOpen(true);
      }
    }
  };

  const handleConfirmSave = async () => {
    if (!postToSave) return;

    try {
      soundEffects.playClick();
      await supabase.from("saved_posts").insert({
        post_id: postToSave.id,
        user_id: userId,
        collection_id: selectedCollection || null,
      });
      toast({
        title: "Kaydedildi",
        description: selectedCollection
          ? "Gönderi koleksiyona kaydedildi"
          : "Gönderi başarıyla kaydedildi"
      });
      await loadPosts(userId);
      setSaveDialogOpen(false);
      setPostToSave(null);
      setSelectedCollection("");
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
    }
  };

  const handleCommentLike = async (commentId: string, hasLiked: boolean) => {
    try {
      if (hasLiked) {
        await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
      } else {
        soundEffects.playLike();
        await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
      }
      if (selectedPost) await loadComments(selectedPost.id);
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          profiles!post_comments_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithLikes = await Promise.all(
        (data || []).map(async (c: any) => {
          const { count: likesCount } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", c.id);

          const { data: likeCheck } = await supabase
            .from("comment_likes")
            .select("id")
            .eq("comment_id", c.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            parent_comment_id: c.parent_comment_id,
            user_id: c.user_id,
            user: c.profiles,
            likes: likesCount || 0,
            hasLiked: !!likeCheck,
            replies: [],
          };
        })
      );

      // Organize comments into parent-child structure
      const parentComments = commentsWithLikes.filter(c => !c.parent_comment_id);
      const childComments = commentsWithLikes.filter(c => c.parent_comment_id);

      parentComments.forEach(parent => {
        parent.replies = childComments.filter(child => child.parent_comment_id === parent.id);
      });

      setComments(parentComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentsDialogOpen(true);
    setComments([]); // Reset comments
    await loadComments(post.id);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      soundEffects.playMessageSent();
      await supabase.from("post_comments").insert({
        post_id: selectedPost.id,
        user_id: userId,
        content: newComment.trim(),
        parent_comment_id: replyingTo,
      });

      setNewComment("");
      setReplyingTo(null);
      await loadComments(selectedPost.id);
      await loadPosts(userId);
    } catch (error: any) {
      soundEffects.playError();
      toast({ title: "Hata", description: "Yorum eklenemedi", variant: "destructive" });
    }
  };

  const handleOpenShareDialog = (post: Post) => {
    setPostToShare(post);
    setSelectedFriends(new Set());
    setShareDialogOpen(true);
  };

  const handleShareToFriends = async () => {
    if (!postToShare || selectedFriends.size === 0) {
      toast({ title: "Uyarı", description: "Lütfen en az bir arkadaş seçin", variant: "destructive" });
      return;
    }

    try {
      // Create message content with post info
      let messageContent = `📸 ${postToShare.profile.full_name || postToShare.profile.username} adlı kişinin paylaşımı:\n\n`;
      if (postToShare.content) {
        messageContent += postToShare.content.substring(0, 100);
        if (postToShare.content.length > 100) messageContent += "...";
      }

      // Send messages to selected friends
      const messagesToInsert = Array.from(selectedFriends).map(friendId => ({
        sender_id: userId,
        receiver_id: friendId,
        content: messageContent,
        message_category: "friend" as const,
      }));

      const { error: messageError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (messageError) throw messageError;

      // Update shares count
      await supabase
        .from("posts")
        .update({ shares_count: (postToShare.shares_count || 0) + selectedFriends.size })
        .eq("id", postToShare.id);

      toast({ 
        title: "Başarılı", 
        description: `Gönderi ${selectedFriends.size} arkadaşınıza gönderildi` 
      });

      setShareDialogOpen(false);
      await loadPosts(userId);
    } catch (error: any) {
      toast({ title: "Hata", description: "Gönderi paylaşılamadı", variant: "destructive" });
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId);
    } else {
      newSelection.add(friendId);
    }
    setSelectedFriends(newSelection);
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'} animate-fade-in`}>
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
              onClick={() => handleCommentLike(comment.id, comment.hasLiked)}
            >
              <Heart className={`w-3 h-3 inline mr-1 ${comment.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
              {comment.likes > 0 && comment.likes}
            </button>
            {!isReply && (
              <button
                className="hover:text-primary font-medium transition-colors"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="w-3 h-3 inline mr-1" />
                Yanıtla
              </button>
            )}
          </div>
          {comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPost = (post: Post) => (
    <Card key={post.id} className="mb-6 overflow-hidden card-hover animate-fade-in-up border-border/50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/profile/${post.profile.username}`)}
          >
            <Avatar className="ring-2 ring-border hover-scale">
              <AvatarImage src={post.profile.profile_photo || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {post.profile.full_name?.[0] || post.profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.profile.full_name || post.profile.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full interactive">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {post.content && (
          <div className="text-foreground whitespace-pre-wrap mb-3 text-sm leading-relaxed">
            <ParsedText text={post.content} />
          </div>
        )}
      </div>

      {post.media_url && (
        <div className="w-full">
          {post.media_type === "photo" ? (
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full max-h-[500px] object-cover"
            />
          ) : (
            <video 
              src={post.media_url} 
              controls 
              className="w-full max-h-[500px]"
            />
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
          <span>{post.likes} beğeni</span>
          <span>{post.comments} yorum • {post.shares_count} paylaşım</span>
        </div>

        <Separator className="mb-3" />

        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-red-50 hover:text-red-500 transition-colors press-effect"
            onClick={() => handleLike(post.id, post.hasLiked)}
          >
            <Heart className={`w-5 h-5 transition-transform hover:scale-110 ${post.hasLiked ? "fill-red-500 text-red-500 animate-bounce-in" : ""}`} />
            Beğen
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-blue-50 hover:text-blue-500 transition-colors press-effect"
            onClick={() => handleOpenComments(post)}
          >
            <MessageCircle className="w-5 h-5" />
            Yorum
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-green-50 hover:text-green-500 transition-colors press-effect"
            onClick={() => handleOpenShareDialog(post)}
          >
            <Share2 className="w-5 h-5" />
            Paylaş
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2 hover:bg-yellow-50 hover:text-yellow-600 transition-colors press-effect"
            onClick={() => handleSave(post.id, post.hasSaved)}
          >
            <Bookmark className={`w-5 h-5 transition-transform hover:scale-110 ${post.hasSaved ? "fill-yellow-600 text-yellow-600 animate-bounce-in" : ""}`} />
            Kaydet
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle pb-20 lg:pb-0">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl space-y-4 sm:space-y-6">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20 lg:pb-0">
      <Header />
      <div ref={containerRef} className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-2xl relative">
        {/* Pull to Refresh Indicator */}
        {(isPulling || isRefreshing) && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-200 z-50"
            style={{ 
              transform: `translateX(-50%) translateY(${Math.min(pullDistance, 80)}px)`,
              opacity: Math.min(pullDistance / 80, 1)
            }}
          >
            <div className={`bg-primary text-primary-foreground rounded-full p-3 shadow-lg ${isRefreshing ? 'animate-spin' : shouldTrigger ? 'scale-110' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
          Akış
        </h1>

        {/* Stories Bar */}
        {userId && (
          <Card className="mb-4 sm:mb-6 overflow-hidden">
            <StoriesBar currentUserId={userId} />
          </Card>
        )}
        
        <Tabs defaultValue="friends" className="w-full space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="friends" className="text-sm sm:text-base">Arkadaşlarım</TabsTrigger>
            <TabsTrigger value="discover" className="text-sm sm:text-base">Keşfet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-0">
            {friendsPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">
                  Henüz arkadaşlarınızdan paylaşım yok
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Keşfet sekmesinden yeni arkadaşlar bulun
                </p>
              </Card>
            ) : (
              friendsPosts.map(renderPost)
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="mt-0">
            {allPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  Henüz paylaşım yok
                </p>
              </Card>
            ) : (
              allPosts.map(renderPost)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Comments Dialog */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl">Yorumlar</DialogTitle>
            <DialogDescription>
              Bu gönderiye yapılan yorumları görüntüleyin ve yeni yorum ekleyin
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(85vh-180px)] px-6">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Henüz yorum yok
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  İlk yorumu siz yapın!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {comments.map(comment => renderComment(comment))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Reply className="w-3 h-3" />
                <span>Yanıtlanıyor</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 ml-auto"
                  onClick={() => setReplyingTo(null)}
                >
                  İptal
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={""} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  ME
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder={replyingTo ? "Yanıtınızı yazın..." : "Yorum yazın..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="icon"
                className="flex-shrink-0"
              >
                <Reply className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Arkadaşlarınla Paylaş</DialogTitle>
            <DialogDescription>
              Bu gönderiyi arkadaşlarınıza mesaj olarak gönderin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Henüz arkadaşınız yok</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFriends.has(friend.user_id)
                          ? "bg-primary/10 border-2 border-primary"
                          : "hover:bg-muted border-2 border-transparent"
                      }`}
                      onClick={() => toggleFriendSelection(friend.user_id)}
                    >
                      <Avatar>
                        <AvatarImage src={friend.profile_photo || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {friend.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {friend.full_name || friend.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                      {selectedFriends.has(friend.user_id) && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleShareToFriends}
                disabled={selectedFriends.size === 0}
                className="flex-1"
              >
                Gönder ({selectedFriends.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save to Collection Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kaydet</DialogTitle>
            <DialogDescription>
              Gönderiyi bir koleksiyona kaydedin veya koleksiyonsuz kaydedin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Koleksiyon seç (isteğe bağlı)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Koleksiyonsuz</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {collection.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => navigate("/saved")}
              variant="outline"
              className="w-full gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Yeni Koleksiyon Oluştur
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setPostToSave(null);
                  setSelectedCollection("");
                }}
                className="flex-1"
              >
                İptal
              </Button>
              <Button onClick={handleConfirmSave} className="flex-1">
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;