import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Post {
  id: string;
  user_id: string;
  analysis_type: string;
  created_at: string;
  is_public: boolean;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  analysis_result: any;
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    await loadPosts(user.id);
  };

  const loadPosts = async (userId: string) => {
    try {
      // Load friends' posts
      const { data: friendsData, error: friendsError } = await supabase
        .from("shared_analyses")
        .select(`
          id,
          user_id,
          analysis_type,
          analysis_id,
          created_at,
          is_public,
          visibility_type,
          profiles!shared_analyses_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("is_visible", true)
        .in("visibility_type", ["friends", "public"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (friendsError) throw friendsError;

      // Load public posts from everyone
      const { data: publicData, error: publicError } = await supabase
        .from("shared_analyses")
        .select(`
          id,
          user_id,
          analysis_type,
          analysis_id,
          created_at,
          is_public,
          profiles!shared_analyses_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("is_visible", true)
        .eq("visibility_type", "public")
        .order("created_at", { ascending: false })
        .limit(50);

      if (publicError) throw publicError;

      // Get analysis results for each post
      const friendsPostsWithData = await Promise.all(
        (friendsData || []).map(async (post: any) => {
          const result = await getAnalysisResult(post.analysis_type, post.analysis_id);
          return {
            ...post,
            profile: post.profiles,
            analysis_result: result,
          };
        })
      );

      const publicPostsWithData = await Promise.all(
        (publicData || []).map(async (post: any) => {
          const result = await getAnalysisResult(post.analysis_type, post.analysis_id);
          return {
            ...post,
            profile: post.profiles,
            analysis_result: result,
          };
        })
      );

      setFriendsPosts(friendsPostsWithData);
      setPublicPosts(publicPostsWithData);
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

  const getAnalysisResult = async (analysisType: string, analysisId: string) => {
    try {
      let tableName = "";
      if (analysisType === "handwriting") tableName = "analysis_history";
      else if (analysisType === "numerology") tableName = "numerology_analyses";
      else if (analysisType === "birth_chart") tableName = "birth_chart_analyses";
      else if (analysisType === "compatibility") tableName = "compatibility_analyses";

      if (!tableName) return null;

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", analysisId)
        .maybeSingle();

      if (error) throw error;
      return (data as any)?.result;
    } catch (error) {
      console.error("Error loading analysis:", error);
      return null;
    }
  };

  const renderPost = (post: Post) => {
    const analysisTypeNames: Record<string, string> = {
      handwriting: "El Yazısı Analizi",
      numerology: "Numeroloji Analizi",
      birth_chart: "Doğum Haritası Analizi",
      compatibility: "Uyum Analizi",
    };

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
                <AvatarFallback>
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
            <Badge variant="secondary">{analysisTypeNames[post.analysis_type]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {post.analysis_result && (
            <div className="prose prose-sm max-w-none">
              <p className="line-clamp-3 text-foreground">
                {typeof post.analysis_result === "string"
                  ? post.analysis_result.substring(0, 200) + "..."
                  : JSON.stringify(post.analysis_result).substring(0, 200) + "..."}
              </p>
              <button
                onClick={() => navigate(`/profile/${post.profile.username}`)}
                className="text-primary hover:underline mt-2 text-sm font-medium"
              >
                Devamını oku
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Akış</h1>
        
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
            {publicPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Henüz herkese açık paylaşım yok
                </p>
              </Card>
            ) : (
              publicPosts.map(renderPost)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Feed;
