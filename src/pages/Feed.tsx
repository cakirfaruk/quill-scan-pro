import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { useImpersonate } from "@/hooks/use-impersonate";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
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
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const { getEffectiveUserId } = useImpersonate();

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const effectiveUserId = getEffectiveUserId(user.id);
    if (!effectiveUserId) {
      navigate("/auth");
      return;
    }
    
    setUserId(effectiveUserId);
    await loadPosts(effectiveUserId);
  };

  const loadPosts = async (currentUserId: string) => {
    try {
      // Load all posts with profile data
      const { data: postsData, error: postsError } = await supabase
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
        .limit(100);

      if (postsError) throw postsError;

      // Get likes and comments count for each post
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post: any) => {
          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: commentsCount } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { data: likeCheck } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", post.id)
            .eq("user_id", currentUserId)
            .maybeSingle();

          return {
            ...post,
            profile: post.profiles,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            hasLiked: !!likeCheck,
          };
        })
      );

      // Filter friends posts (user's own posts + friends' posts)
      const friendsPosts = postsWithData.filter(post => {
        return post.user_id === currentUserId; // Will be extended with friends check via RLS
      });

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
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: userId,
          });

        if (error) throw error;
      }

      await loadPosts(userId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi",
        variant: "destructive",
      });
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentsDialogOpen(true);

    // Load comments
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
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments((data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user: c.profiles,
      })));
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: selectedPost.id,
          user_id: userId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      handleOpenComments(selectedPost);
      await loadPosts(userId);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Yorum eklenemedi",
        variant: "destructive",
      });
    }
  };

  const handleSendAsMessage = async (post: Post) => {
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: userId,
          receiver_id: post.user_id,
          content: `📸 Paylaşım: ${post.content || ""}`,
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Mesaj gönderildi",
      });

      navigate(`/messages?userId=${post.user_id}`);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    }
  };

  const renderPost = (post: Post) => {
    return (
      <Card key={post.id} className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={() => navigate(`/profile/${post.profile.username}`)}
            >
              <Avatar>
                <AvatarImage src={post.profile.profile_photo || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {post.profile.full_name?.[0] || post.profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.profile.full_name || post.profile.username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {post.content && (
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          )}
          
          {post.media_url && (
            <div className="rounded-lg overflow-hidden">
              {post.media_type === "photo" ? (
                <img 
                  src={post.media_url} 
                  alt="Post media" 
                  className="w-full max-h-96 object-cover"
                />
              ) : (
                <video 
                  src={post.media_url} 
                  controls 
                  className="w-full max-h-96"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => handleLike(post.id, post.hasLiked)}
            >
              <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
              {post.likes}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => handleOpenComments(post)}
            >
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </Button>

            {post.user_id !== userId && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 ml-auto"
                onClick={() => handleSendAsMessage(post)}
              >
                <Send className="w-4 h-4" />
                Mesaj Gönder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Akış
        </h1>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="friends">Arkadaşlarım</TabsTrigger>
            <TabsTrigger value="discover">Keşfet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends">
            {friendsPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Henüz arkadaşlarınızdan paylaşım yok
                </p>
              </Card>
            ) : (
              friendsPosts.map(renderPost)
            )}
          </TabsContent>
          
          <TabsContent value="discover">
            {allPosts.length === 0 ? (
              <Card className="p-8 text-center">
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
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Yorumlar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz yorum yok
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar 
                      className="w-8 h-8 cursor-pointer"
                      onClick={() => navigate(`/profile/${comment.user.username}`)}
                    >
                      <AvatarImage src={comment.user.profile_photo || undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                        {comment.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p 
                          className="font-semibold text-sm cursor-pointer hover:underline"
                          onClick={() => navigate(`/profile/${comment.user.username}`)}
                        >
                          {comment.user.full_name || comment.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                        </p>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Yorum yaz..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button onClick={handleAddComment} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
