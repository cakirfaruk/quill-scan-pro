import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FileText, Hash, UserCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface SearchResult {
  type: "user" | "post" | "group" | "hashtag";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  data?: any;
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search users
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (users) {
        allResults.push(
          ...users.map((user) => ({
            type: "user" as const,
            id: user.user_id,
            title: user.username,
            subtitle: user.full_name || undefined,
            imageUrl: user.profile_photo || undefined,
            data: user,
          }))
        );
      }

      // Search posts
      const { data: posts } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (username, profile_photo)
        `)
        .ilike("content", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (posts) {
        allResults.push(
          ...posts.map((post: any) => ({
            type: "post" as const,
            id: post.id,
            title: post.content.substring(0, 60) + (post.content.length > 60 ? "..." : ""),
            subtitle: `@${post.profiles?.username || "kullanıcı"}`,
            imageUrl: post.profiles?.profile_photo || undefined,
            data: post,
          }))
        );
      }

      // Search groups
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name, description, photo_url")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      if (groups) {
        allResults.push(
          ...groups.map((group) => ({
            type: "group" as const,
            id: group.id,
            title: group.name,
            subtitle: group.description || undefined,
            imageUrl: group.photo_url || undefined,
            data: group,
          }))
        );
      }

      // Search hashtags
      const { data: hashtags } = await supabase
        .from("hashtags")
        .select("id, tag, usage_count")
        .ilike("tag", `%${searchQuery}%`)
        .order("usage_count", { ascending: false })
        .limit(5);

      if (hashtags) {
        allResults.push(
          ...hashtags.map((hashtag) => ({
            type: "hashtag" as const,
            id: hashtag.id,
            title: `#${hashtag.tag}`,
            subtitle: `${hashtag.usage_count} gönderi`,
            data: hashtag,
          }))
        );
      }

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);

    switch (result.type) {
      case "user":
        navigate(`/profile?userId=${result.id}`);
        break;
      case "post":
        navigate(`/feed?postId=${result.id}`);
        break;
      case "group":
        navigate(`/group-chat?groupId=${result.id}`);
        break;
      case "hashtag":
        navigate(`/explore?hashtag=${result.data.tag}`);
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
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
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 mr-2 shrink-0 opacity-50" />
            <Input
              placeholder="Kullanıcı, gönderi, grup veya hashtag ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
              autoFocus
            />
          </div>

          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {query.trim() ? "Sonuç bulunamadı" : "Aramaya başlayın..."}
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type} className="mb-4 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {type === "user" && "Kullanıcılar"}
                      {type === "post" && "Gönderiler"}
                      {type === "group" && "Gruplar"}
                      {type === "hashtag" && "Hashtag'ler"}
                    </div>
                    <div className="space-y-1">
                      {typeResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
                        >
                          {result.imageUrl ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={result.imageUrl} />
                              <AvatarFallback>
                                {result.title.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {getResultIcon(result.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono font-medium">
              <span>ESC</span>
            </kbd>
            {" "}tuşuna basarak kapatın
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
