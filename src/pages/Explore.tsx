import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, TrendingUp, Hash, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ParsedText } from "@/components/ParsedText";

interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_url: string | null;
  media_type: string | null;
  user?: {
    username: string;
    profile_photo: string | null;
  };
}

const Explore = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("hashtag") || "");
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "search">(
    searchParams.get("hashtag") ? "search" : "trending"
  );
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTrendingHashtags();
    const hashtagParam = searchParams.get("hashtag");
    if (hashtagParam) {
      setSearchQuery(hashtagParam);
      searchHashtag(hashtagParam);
    }
  }, []);

  const loadTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from("hashtags")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (error: any) {
      console.error("Error loading hashtags:", error);
      toast({
        title: "Hata",
        description: "Trend hashtagler yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const searchHashtag = async (tag: string) => {
    if (!tag.trim()) return;

    setIsLoading(true);
    try {
      // Get hashtag ID
      const { data: hashtagData } = await supabase
        .from("hashtags")
        .select("id")
        .eq("tag", tag.toLowerCase().replace("#", ""))
        .single();

      if (!hashtagData) {
        setSearchResults([]);
        toast({
          title: "Sonuç bulunamadı",
          description: "Bu hashtag için gönderi bulunamadı.",
        });
        return;
      }

      // Get posts with this hashtag
      const { data: postHashtags } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", hashtagData.id);

      if (!postHashtags || postHashtags.length === 0) {
        setSearchResults([]);
        return;
      }

      const postIds = postHashtags.map((ph) => ph.post_id);

      // Get posts
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            profile_photo
          )
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const posts = postsData?.map((post) => ({
        ...post,
        user: {
          username: post.profiles?.username || "Unknown",
          profile_photo: post.profiles?.profile_photo,
        },
      })) || [];

      setSearchResults(posts);
      setActiveTab("search");
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Hata",
        description: "Arama yapılamadı.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHashtag(searchQuery);
  };

  const handleHashtagClick = (tag: string) => {
    setSearchQuery(tag);
    searchHashtag(tag);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Keşfet
        </h1>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Hashtag ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>
        </Card>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trendler
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Arama Sonuçları
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trend Hashtagler
              </h2>
              
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {trendingHashtags.map((hashtag, index) => (
                    <button
                      key={hashtag.id}
                      onClick={() => handleHashtagClick(hashtag.tag)}
                      className="w-full text-left p-4 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-muted-foreground">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-accent group-hover:underline">
                              #{hashtag.tag}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {hashtag.usage_count} gönderi
                            </p>
                          </div>
                        </div>
                        <Hash className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}

                  {trendingHashtags.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Henüz trend hashtag yok</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-4">
              {searchResults.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <strong>#{searchQuery}</strong> için {searchResults.length} sonuç bulundu
                </p>
              )}

              {searchResults.map((post) => (
                <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${post.user?.username}`)}
                    >
                      <AvatarImage src={post.user?.profile_photo || undefined} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {post.user?.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => navigate(`/profile/${post.user?.username}`)}
                          className="font-semibold hover:underline"
                        >
                          @{post.user?.username}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      <ParsedText text={post.content || ""} className="text-sm" />

                      {post.media_url && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          {post.media_type === "photo" ? (
                            <img
                              src={post.media_url}
                              alt="Post"
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
                    </div>
                  </div>
                </Card>
              ))}

              {searchResults.length === 0 && !isLoading && searchQuery && (
                <Card className="p-12 text-center">
                  <Hash className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    <strong>#{searchQuery}</strong> için sonuç bulunamadı
                  </p>
                </Card>
              )}

              {!searchQuery && (
                <Card className="p-12 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Hashtag arayarak gönderileri keşfedin
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Explore;
