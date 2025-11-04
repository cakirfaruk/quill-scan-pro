import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, MessageCircle, Image as ImageIcon, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface GroupSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

interface SearchResult {
  id: string;
  type: "message" | "media" | "poll";
  content: string;
  created_at: string;
  sender?: {
    username: string;
    profile_photo: string | null;
  };
  media_url?: string;
  media_type?: string;
}

export const GroupSearch = ({ open, onOpenChange, groupId }: GroupSearchProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [messageResults, setMessageResults] = useState<SearchResult[]>([]);
  const [mediaResults, setMediaResults] = useState<SearchResult[]>([]);
  const [pollResults, setPollResults] = useState<SearchResult[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setMessageResults([]);
      setMediaResults([]);
      setPollResults([]);
      return;
    }

    try {
      setSearching(true);

      const searchTerm = `%${query.trim().toLowerCase()}%`;

      // Search messages
      const { data: messages } = await supabase
        .from("group_messages")
        .select("id, content, media_url, media_type, created_at, sender_id")
        .eq("group_id", groupId)
        .ilike("content", searchTerm)
        .order("created_at", { ascending: false })
        .limit(50);

      // Search media messages
      const { data: media } = await supabase
        .from("group_messages")
        .select("id, content, media_url, media_type, created_at, sender_id")
        .eq("group_id", groupId)
        .not("media_url", "is", null)
        .or(`content.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(50);

      // Search polls
      const { data: polls } = await supabase
        .from("group_polls")
        .select("id, question, created_at, created_by")
        .eq("group_id", groupId)
        .ilike("question", searchTerm)
        .order("created_at", { ascending: false })
        .limit(50);

      // Get all sender IDs
      const allSenderIds = [
        ...(messages || []).map((m) => m.sender_id),
        ...(media || []).map((m) => m.sender_id),
        ...(polls || []).map((p) => p.created_by),
      ];
      const uniqueSenderIds = [...new Set(allSenderIds)];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, profile_photo")
        .in("user_id", uniqueSenderIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Format message results
      setMessageResults(
        (messages || []).map((msg) => ({
          id: msg.id,
          type: "message" as const,
          content: msg.content,
          created_at: msg.created_at,
          sender: profileMap.get(msg.sender_id) || { username: "Bilinmeyen", profile_photo: null },
        }))
      );

      // Format media results
      setMediaResults(
        (media || []).map((msg) => ({
          id: msg.id,
          type: "media" as const,
          content: msg.content,
          media_url: msg.media_url || undefined,
          media_type: msg.media_type || undefined,
          created_at: msg.created_at,
          sender: profileMap.get(msg.sender_id) || { username: "Bilinmeyen", profile_photo: null },
        }))
      );

      // Format poll results
      setPollResults(
        (polls || []).map((poll) => ({
          id: poll.id,
          type: "poll" as const,
          content: poll.question,
          created_at: poll.created_at,
          sender: profileMap.get(poll.created_by) || { username: "Bilinmeyen", profile_photo: null },
        }))
      );
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Arama yapılamadı",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-primary/30 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const ResultItem = ({ result }: { result: SearchResult }) => (
    <div className="p-3 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={result.sender?.profile_photo || undefined} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
            {result.sender?.username.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">{result.sender?.username || "Bilinmeyen"}</p>
            <Badge variant="secondary" className="text-xs">
              {result.type === "message" && <MessageCircle className="w-3 h-3 mr-1" />}
              {result.type === "media" && <ImageIcon className="w-3 h-3 mr-1" />}
              {result.type === "poll" && <BarChart3 className="w-3 h-3 mr-1" />}
              {result.type === "message" && "Mesaj"}
              {result.type === "media" && "Medya"}
              {result.type === "poll" && "Anket"}
            </Badge>
          </div>

          {result.media_url && (
            <div className="mb-2">
              {result.media_type?.startsWith("image") ? (
                <img
                  src={result.media_url}
                  alt="Medya"
                  className="w-32 h-32 object-cover rounded"
                />
              ) : (
                <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightText(result.content, searchQuery)}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(result.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ara</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Mesajlarda, medyada ve anketlerde ara..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        {searchQuery.trim() ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Tümü ({messageResults.length + mediaResults.length + pollResults.length})
              </TabsTrigger>
              <TabsTrigger value="messages">
                Mesajlar ({messageResults.length})
              </TabsTrigger>
              <TabsTrigger value="media">
                Medya ({mediaResults.length})
              </TabsTrigger>
              <TabsTrigger value="polls">
                Anketler ({pollResults.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[50vh] mt-4">
              <TabsContent value="all" className="space-y-2">
                {[...messageResults, ...mediaResults, ...pollResults].length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mb-2" />
                    <p>Sonuç bulunamadı</p>
                  </div>
                ) : (
                  <>
                    {[...messageResults, ...mediaResults, ...pollResults]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((result) => (
                        <ResultItem key={`${result.type}-${result.id}`} result={result} />
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="messages" className="space-y-2">
                {messageResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p>Mesaj bulunamadı</p>
                  </div>
                ) : (
                  messageResults.map((result) => (
                    <ResultItem key={result.id} result={result} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="media" className="space-y-2">
                {mediaResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p>Medya bulunamadı</p>
                  </div>
                ) : (
                  mediaResults.map((result) => (
                    <ResultItem key={result.id} result={result} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="polls" className="space-y-2">
                {pollResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mb-2" />
                    <p>Anket bulunamadı</p>
                  </div>
                ) : (
                  pollResults.map((result) => (
                    <ResultItem key={result.id} result={result} />
                  ))
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-2" />
            <p>Aramaya başlamak için bir şeyler yazın</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
