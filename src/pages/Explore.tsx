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
import { Search, TrendingUp, Hash, Loader2, Users, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ParsedText } from "@/components/ParsedText";
import { SkeletonHashtagList, SkeletonSearchResult } from "@/components/SkeletonHashtag";

interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
}

interface UserProfile {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  bio: string | null;
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
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"hashtags" | "users">("hashtags");
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
        .select("id, tag, usage_count")
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

  const searchUsers = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo, bio")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setUserSearchResults(data || []);
      setActiveTab("search");
    } catch (error: any) {
      console.error("User search error:", error);
      toast({
        title: "Hata",
        description: "Kullanıcı araması yapılamadı.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    if (searchType === "hashtags") {
      searchHashtag(searchQuery);
    } else {
      searchUsers(searchQuery);
    }
  };

  const handleHashtagClick = (tag: string) => {
    setSearchQuery(tag);
    searchHashtag(tag);
  };

  return (
    <div className="min-h-screen bg-transparent pb-32 overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-slate-900/50 to-black" />
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-64 h-64 bg-accent/10 rounded-full blur-[80px] animate-pulse delay-1000" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-primary/80 to-accent bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Kozmik Keşif
          </h1>
          <p className="text-white/60">Evrendeki işaretleri ve ruhları ara</p>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-1.5 rounded-full mb-8 shadow-neon border-white/20 hover:border-primary/50 transition-colors">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                placeholder={
                  searchType === "hashtags" ? "Hashtag ara... (#astroloji)" : "Kullanıcı ara... (@kullanici)"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-white/30 text-lg"
              />
            </div>
            <div className="flex bg-white/10 rounded-full p-1 mr-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchType("hashtags")}
                className={`rounded-full h-10 px-4 transition-all ${searchType === "hashtags" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"}`}
              >
                <Hash className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchType("users")}
                className={`rounded-full h-10 px-4 transition-all ${searchType === "users" ? "bg-accent text-white shadow-glow" : "text-white/50 hover:text-white"}`}
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>
            <Button type="submit" size="icon" disabled={isLoading} className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 mr-1 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 p-1 rounded-full border border-white/10">
            <TabsTrigger value="trending" className="rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border border-primary/20 transition-all duration-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trendler
            </TabsTrigger>
            <TabsTrigger value="search" className="rounded-full data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:border border-accent/20 transition-all duration-300">
              <Search className="w-4 h-4 mr-2" />
              Sonuçlar
            </TabsTrigger>
          </TabsList>

            <TabsContent value="trending">
              <div className="glass-card p-6 border-white/10 animate-fade-in">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <span className="bg-primary/20 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-primary" /></span>
                  Gündemdeki Konular
                </h2>

                {isLoading ? (
                  <SkeletonHashtagList count={10} />
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {trendingHashtags.map((hashtag, index) => (
                        <button
                          key={hashtag.id}
                          onClick={() => handleHashtagClick(hashtag.tag)}
                          className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden hover:scale-[1.02] hover:translate-x-1 active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-black text-white/10 group-hover:text-primary/20 transition-colors w-12 text-center">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                                  #{hashtag.tag}
                                </p>
                                <p className="text-sm text-white/40">
                                  {hashtag.usage_count} gönderi
                                </p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-glow">
                              <Hash className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}

                      {trendingHashtags.length === 0 && (
                        <div className="text-center py-20 text-white/30">
                          <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Henüz trend hashtag yok</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="search">
              <div className="animate-fade-in">
                {isLoading ? (
                  <div className="space-y-4">
                    {searchType === "users" ? (
                      <SkeletonHashtagList count={5} />
                    ) : (
                      <>
                        <SkeletonSearchResult />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchType === "users" ? (
                      <>
                        {userSearchResults.length > 0 && (
                          <p className="text-sm text-white/50 mb-4 ml-2">
                            {userSearchResults.length} kozmik ruh bulundu
                          </p>
                        )}

                        {userSearchResults.map((user) => (
                          <div
                            key={user.user_id}
                            className="glass-card p-4 hover:bg-white/5 transition-colors cursor-pointer border-white/10 group animate-fade-in"
                            onClick={() => navigate(`/profile/${user.username}`)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-accent transition-all">
                                  <AvatarImage src={user.profile_photo || undefined} className="object-cover" />
                                  <AvatarFallback className="bg-black text-white/50">
                                    {user.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>

                              <div className="flex-1">
                                <p className="font-bold text-white text-lg">@{user.username}</p>
                                {user.full_name && (
                                  <p className="text-sm text-white/60">
                                    {user.full_name}
                                  </p>
                                )}
                                {user.bio && (
                                  <p className="text-xs text-white/40 line-clamp-1 mt-1 font-light italic">
                                    "{user.bio}"
                                  </p>
                                )}
                              </div>
                              <Users className="w-5 h-5 text-white/20 group-hover:text-accent transition-colors" />
                            </div>
                          </div>
                        ))}

                        {userSearchResults.length === 0 && !isLoading && searchQuery && (
                          <div className="text-center py-20 text-white/40 glass-panel border-dashed border-white/10">
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>
                              <strong>{searchQuery}</strong> aramasına uygun ruh bulunamadı.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {searchResults.length > 0 && (
                          <p className="text-sm text-white/50 mb-4 ml-2">
                            <strong>#{searchQuery}</strong> konusunda {searchResults.length} kozmik mesaj
                          </p>
                        )}

                        {searchResults.map((post) => (
                          <div key={post.id} className="animate-fade-in">
                            <Card className="p-5 glass-card border-white/10 hover:border-primary/30 transition-all group">
                              <div className="flex items-start gap-4">
                                <Avatar
                                  className="w-10 h-10 cursor-pointer ring-2 ring-white/10 group-hover:ring-primary/50 transition-all"
                                  onClick={() => navigate(`/profile/${post.user?.username}`)}
                                >
                                  <AvatarImage src={post.user?.profile_photo || undefined} className="object-cover" />
                                  <AvatarFallback className="bg-black text-white/50">
                                    {post.user?.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <button
                                      onClick={() => navigate(`/profile/${post.user?.username}`)}
                                      className="font-bold text-white hover:text-primary transition-colors"
                                    >
                                      @{post.user?.username}
                                    </button>
                                    <span className="text-xs text-white/30">
                                      • {new Date(post.created_at).toLocaleDateString("tr-TR")}
                                    </span>
                                  </div>

                                  <ParsedText text={post.content || ""} className="text-sm text-white/90 leading-relaxed" />

                                  {post.media_url && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
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
                                          className="w-full max-h-96 bg-black"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        ))}

                        {searchResults.length === 0 && !isLoading && searchQuery && (
                          <div className="text-center py-20 text-white/40 glass-panel border-dashed border-white/10">
                            <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>
                              <strong>#{searchQuery}</strong> hakkında henüz kozmik mesaj yok.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {!searchQuery && (
                      <div className="text-center py-20 text-white/30">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                        <p className="text-lg">
                          Keşfetmek için bir hashtag veya kullanıcı adı girin...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Explore;
