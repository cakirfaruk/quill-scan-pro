import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FileText, Hash, UserCircle, Loader2, Clock, X, SlidersHorizontal, Sparkles, TrendingUp, Star, Calendar } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface SearchResult {
  type: "user" | "post" | "group" | "hashtag" | "feature";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  path?: string;
  data?: any;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  search_type: string | null;
  result_count: number;
  created_at: string;
}

interface TrendingSearch {
  id: string;
  query: string;
  search_count: number;
}

type SearchType = "all" | "user" | "post" | "group" | "hashtag" | "feature";
type SortBy = "relevance" | "date" | "popular";

const EnhancedGlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [filterType, setFilterType] = useState<SearchType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadSearchHistory();
    }
    loadTrendingSearches();
  }, [currentUserId]);

  const loadSearchHistory = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setSearchHistory(data);
  };

  const loadTrendingSearches = async () => {
    const { data } = await supabase
      .from("trending_searches")
      .select("*")
      .order("search_count", { ascending: false })
      .limit(5);

    if (data) setTrendingSearches(data);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }

      if (open && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        }
        if (e.key === "Enter" && results[selectedIndex]) {
          e.preventDefault();
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, results, selectedIndex]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filterType, sortBy]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      await supabase.rpc('update_trending_search', { search_query: searchQuery });

      if (filterType === "all" || filterType === "feature") {
        const features = [
          { id: "tarot", title: "Tarot Falı", subtitle: "Kartlarla geleceğini keşfet", path: "/tarot", icon: "🔮" },
          { id: "birth-chart", title: "Doğum Haritası", subtitle: "Yıldızların senin hakkında söyledikleri", path: "/birth-chart", icon: "⭐" },
          { id: "numerology", title: "Numeroloji", subtitle: "Sayıların gizli anlamları", path: "/numerology", icon: "🔢" },
          { id: "coffee-fortune", title: "Kahve Falı", subtitle: "Fincandaki sırlar", path: "/coffee-fortune", icon: "☕" },
          { id: "palmistry", title: "El Falı", subtitle: "Avucunuzdaki çizgiler", path: "/palmistry", icon: "🤚" },
          { id: "dream", title: "Rüya Tabiri", subtitle: "Rüyalarının anlamı", path: "/dream", icon: "💭" },
          { id: "compatibility", title: "Uyum Analizi", subtitle: "İlişki uyumunuzu öğrenin", path: "/compatibility", icon: "💕" },
          { id: "horoscope", title: "Günlük Burç", subtitle: "Bugün seni neler bekliyor", path: "/daily-horoscope", icon: "♈" },
          { id: "handwriting", title: "El Yazısı Analizi", subtitle: "Yazınız kişiliğinizi yansıtır", path: "/handwriting", icon: "✍️" },
          { id: "feed", title: "Ana Sayfa", subtitle: "Güncel akış", path: "/feed", icon: "🏠" },
          { id: "messages", title: "Mesajlar", subtitle: "Sohbetleriniz", path: "/messages", icon: "💬" },
          { id: "groups", title: "Gruplar", subtitle: "Topluluklar", path: "/groups", icon: "👥" },
          { id: "friends", title: "Arkadaşlar", subtitle: "Bağlantılarınız", path: "/friends", icon: "👫" },
          { id: "discovery", title: "Keşfet", subtitle: "Yeni insanlarla tanış", path: "/discovery", icon: "🎯" },
          { id: "reels", title: "Reels", subtitle: "Kısa videolar", path: "/reels", icon: "🎬" },
        ];

        const matchedFeatures = features.filter(
          (f) =>
            f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        );

        allResults.push(
          ...matchedFeatures.map((feature) => ({
            type: "feature" as const,
            id: feature.id,
            title: feature.title,
            subtitle: feature.subtitle,
            path: feature.path,
            icon: feature.icon,
            data: { created_at: new Date().toISOString() },
          }))
        );
      }

      if (filterType === "all" || filterType === "user") {
        const { data: users } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, profile_photo, bio, created_at")
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
          .limit(20);

        if (users) {
          allResults.push(
            ...users.map((user) => ({
              type: "user" as const,
              id: user.user_id,
              title: user.username,
              subtitle: user.full_name || user.bio?.substring(0, 50) || undefined,
              imageUrl: user.profile_photo || undefined,
              data: { ...user, created_at: user.created_at || new Date().toISOString() },
            }))
          );
        }
      }

      if (filterType === "all" || filterType === "post") {
        const { data: posts } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            created_at,
            location,
            media_url,
            likes:post_likes(count),
            comments:post_comments(count),
            profiles:user_id (username, full_name, profile_photo)
          `)
          .ilike("content", `%${searchQuery}%`)
          .order("created_at", { ascending: false })
          .limit(20);

        if (posts) {
          allResults.push(
            ...posts.map((post: any) => ({
              type: "post" as const,
              id: post.id,
              title: post.content.substring(0, 80) + (post.content.length > 80 ? "..." : ""),
              subtitle: `@${post.profiles?.username || "kullanıcı"} · ${post.likes?.[0]?.count || 0} beğeni`,
              imageUrl: post.media_url?.[0] || post.profiles?.profile_photo,
              data: {
                ...post,
                popularity: (post.likes?.[0]?.count || 0) + (post.comments?.[0]?.count || 0) * 2,
              },
            }))
          );
        }
      }

      if (filterType === "all" || filterType === "group") {
        const { data: groups } = await supabase
          .from("groups")
          .select(`
            id,
            name,
            description,
            photo_url,
            created_at,
            members:group_members(count)
          `)
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (groups) {
          allResults.push(
            ...groups.map((group: any) => ({
              type: "group" as const,
              id: group.id,
              title: group.name,
              subtitle: `${group.description?.substring(0, 50) || ''} · ${group.members?.[0]?.count || 0} üye`,
              imageUrl: group.photo_url || undefined,
              data: {
                ...group,
                popularity: group.members?.[0]?.count || 0,
              },
            }))
          );
        }
      }

      if (filterType === "all" || filterType === "hashtag") {
        const { data: hashtags } = await supabase
          .from("hashtags")
          .select("id, tag, usage_count, created_at")
          .ilike("tag", `%${searchQuery}%`)
          .order("usage_count", { ascending: false })
          .limit(20);

        if (hashtags) {
          allResults.push(
            ...hashtags.map((hashtag) => ({
              type: "hashtag" as const,
              id: hashtag.id,
              title: `#${hashtag.tag}`,
              subtitle: `${hashtag.usage_count} gönderi`,
              data: {
                ...hashtag,
                popularity: hashtag.usage_count,
                created_at: hashtag.created_at || new Date().toISOString(),
              },
            }))
          );
        }
      }

      const sortedResults = sortResults(allResults, sortBy);
      setResults(sortedResults);
      setSelectedIndex(0);

      if (currentUserId) {
        await supabase
          .from("search_history")
          .insert({
            user_id: currentUserId,
            query: searchQuery,
            search_type: filterType === "all" ? null : filterType,
            result_count: allResults.length,
          });
        loadSearchHistory();
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortResults = (results: SearchResult[], sortType: SortBy): SearchResult[] => {
    switch (sortType) {
      case "date":
        return [...results].sort((a, b) => {
          const dateA = new Date(a.data?.created_at || 0).getTime();
          const dateB = new Date(b.data?.created_at || 0).getTime();
          return dateB - dateA;
        });
      case "popular":
        return [...results].sort((a, b) => {
          const popA = a.data?.popularity || 0;
          const popB = b.data?.popularity || 0;
          return popB - popA;
        });
      case "relevance":
      default:
        return results;
    }
  };

  const clearHistory = async () => {
    if (!currentUserId) return;
    
    await supabase
      .from("search_history")
      .delete()
      .eq("user_id", currentUserId);

    setSearchHistory([]);
  };

  const removeHistoryItem = async (historyId: string) => {
    await supabase
      .from("search_history")
      .delete()
      .eq("id", historyId);

    setSearchHistory(prev => prev.filter(item => item.id !== historyId));
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const handleTrendingClick = (trendingQuery: string) => {
    setQuery(trendingQuery);
  };

  const handleResultClick = useCallback(async (result: SearchResult) => {
    if (currentUserId) {
      await supabase
        .from("search_history")
        .update({
          clicked_result_id: result.id,
          clicked_result_type: result.type,
        })
        .eq("user_id", currentUserId)
        .eq("query", query)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    setOpen(false);
    setQuery("");
    setResults([]);

    switch (result.type) {
      case "feature":
        navigate(result.path || "/");
        break;
      case "user":
        if (result.data?.username) {
          navigate(`/profile/${result.data.username}`);
        } else {
          navigate(`/profile?userId=${result.id}`);
        }
        break;
      case "post":
        navigate(`/feed?postId=${result.id}`);
        break;
      case "group":
        navigate(`/groups/${result.id}`);
        break;
      case "hashtag":
        navigate(`/explore?hashtag=${result.data.tag}`);
        break;
    }
  }, [currentUserId, query, navigate]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Sparkles className="w-4 h-4" />;
      case "user":
        return <UserCircle className="w-4 h-4" />;
      case "post":
        return <FileText className="w-4 h-4" />;
      case "group":
        return <Users className="w-4 h-4" />;
      case "hashtag":
        return <Hash className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        size="icon"
        className="relative h-8 sm:h-9 w-8 sm:w-9 md:h-9 md:w-full md:justify-start md:text-sm md:text-muted-foreground md:sm:pr-12 md:md:w-40 md:lg:w-64"
      >
        <Search className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline-flex lg:hidden">Ara</span>
        <span className="hidden lg:inline-flex">Ara...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 glass-card">
          <div className="flex items-center border-b px-3 bg-muted/30">
            <Search className="w-4 h-4 mr-2 shrink-0 opacity-50" />
            <Input
              placeholder="Kullanıcı, gönderi, grup, özellik veya hashtag ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 bg-transparent"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery("")}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60 ml-2">
              ESC
            </kbd>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as SearchType)} className="flex-1">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs h-7">Tümü</TabsTrigger>
                <TabsTrigger value="user" className="text-xs h-7">
                  <Users className="w-3 h-3 mr-1" />
                  Kullanıcı
                </TabsTrigger>
                <TabsTrigger value="post" className="text-xs h-7">
                  <FileText className="w-3 h-3 mr-1" />
                  Gönderi
                </TabsTrigger>
                <TabsTrigger value="group" className="text-xs h-7">
                  <Users className="w-3 h-3 mr-1" />
                  Grup
                </TabsTrigger>
                <TabsTrigger value="hashtag" className="text-xs h-7">
                  <Hash className="w-3 h-3 mr-1" />
                  Hashtag
                </TabsTrigger>
                <TabsTrigger value="feature" className="text-xs h-7">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Özellikler
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span className="text-xs">
                    {sortBy === "relevance" && "İlgililik"}
                    {sortBy === "date" && "Tarih"}
                    {sortBy === "popular" && "Popüler"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("relevance")}>
                  <Star className="w-4 h-4 mr-2" />
                  İlgililik
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  En Yeni
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("popular")}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  En Popüler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="max-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4">
                {query.trim() ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8 text-center"
                  >
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
                    <p className="text-xs text-muted-foreground mt-2">Farklı bir arama terimi deneyin</p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {trendingSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground uppercase">
                            Popüler Aramalar
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 px-2">
                          {trendingSearches.map((trending) => (
                            <Badge
                              key={trending.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => handleTrendingClick(trending.query)}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {trending.query}
                              <span className="ml-1 opacity-70">({trending.search_count})</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchHistory.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 py-1.5 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground uppercase">
                              Son Aramalar
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearHistory}
                            className="h-6 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Temizle
                          </Button>
                        </div>
                        <div className="space-y-1 px-2">
                          {searchHistory.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent group cursor-pointer"
                              onClick={() => handleHistoryClick(item.query)}
                            >
                              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{item.query}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.result_count} sonuç · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeHistoryItem(item.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!query && searchHistory.length === 0 && trendingSearches.length === 0 && (
                      <div className="py-8 text-center">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">Aramaya başlayın</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          ⌘K veya Ctrl+K ile hızlıca açabilirsiniz
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2">
                <AnimatePresence mode="popLayout">
                  {Object.entries(groupedResults).map(([type, typeResults]) => (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 last:mb-0"
                    >
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        {type === "feature" && (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Özellikler
                          </>
                        )}
                        {type === "user" && (
                          <>
                            <Users className="w-3 h-3" />
                            Kullanıcılar
                          </>
                        )}
                        {type === "post" && (
                          <>
                            <FileText className="w-3 h-3" />
                            Gönderiler
                          </>
                        )}
                        {type === "group" && (
                          <>
                            <Users className="w-3 h-3" />
                            Gruplar
                          </>
                        )}
                        {type === "hashtag" && (
                          <>
                            <Hash className="w-3 h-3" />
                            Hashtag'ler
                          </>
                        )}
                        <Badge variant="secondary" className="ml-auto">
                          {typeResults.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {typeResults.map((result) => {
                          const globalIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <motion.button
                              key={result.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => handleResultClick(result)}
                              className={cn(
                                "flex items-center gap-3 w-full px-2 py-2.5 rounded-md transition-all text-left",
                                isSelected 
                                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                                  : "hover:bg-accent"
                              )}
                            >
                              {result.type === "feature" && result.icon ? (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl">
                                  {result.icon}
                                </div>
                              ) : result.imageUrl ? (
                                <Avatar className="w-10 h-10 ring-2 ring-border">
                                  <AvatarImage src={result.imageUrl} />
                                  <AvatarFallback>
                                    {result.title.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  isSelected ? "bg-primary-foreground/20" : "bg-muted"
                                )}>
                                  {getResultIcon(result.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate mb-0.5">{result.title}</div>
                                {result.subtitle && (
                                  <div className={cn(
                                    "text-xs truncate",
                                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}>
                                    {result.subtitle}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-primary-foreground/20 px-1.5 font-mono text-[10px] font-medium">
                                  ↵
                                </kbd>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          <div className="border-t px-3 py-2 flex items-center justify-between bg-muted/30">
            <div className="text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono font-medium">
                <span>ESC</span>
              </kbd>
              {" "}tuşuna basarak kapatın
            </div>
            {results.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {results.length} sonuç bulundu
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { EnhancedGlobalSearch as GlobalSearch };
