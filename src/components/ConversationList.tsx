import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Loader2, Users, UserPlus, Heart, MessageSquare, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { NoMessagesIllustration, NoConversationIllustration } from "@/components/EmptyStateIllustrations";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  member_count?: number;
}

interface Conversation {
  type: 'direct' | 'group';
  id: string;
  friend?: Friend;
  group?: Group;
  lastMessage?: any;
  lastMessageSenderName?: string;
  unreadCount: number;
  category?: "friend" | "match" | "other";
  isPinned?: boolean;
}

interface MessageSearchResult {
  message: any;
  conversationId: string;
  conversationType: 'direct' | 'group';
  friend?: Friend;
  group?: Group;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedFriend: Friend | null;
  searchQuery: string;
  searchMode: "conversations" | "messages";
  messageSearchResults: MessageSearchResult[];
  isSearching: boolean;
  activeTab: "friends" | "matches" | "other" | "groups";
  isMobile: boolean;
  onSearchQueryChange: (query: string) => void;
  onSearchModeChange: (mode: "conversations" | "messages") => void;
  onActiveTabChange: (tab: "friends" | "matches" | "other" | "groups") => void;
  onConversationSelect: (friend: Friend, category: "friend" | "match" | "other") => void;
  onPinConversation: (conv: Conversation) => void;
}

export const ConversationList = ({
  conversations,
  selectedFriend,
  searchQuery,
  searchMode,
  messageSearchResults,
  isSearching,
  activeTab,
  isMobile,
  onSearchQueryChange,
  onSearchModeChange,
  onActiveTabChange,
  onConversationSelect,
  onPinConversation,
}: ConversationListProps) => {
  const navigate = useNavigate();

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    if (conv.type === 'direct' && conv.friend) {
      return conv.friend.username.toLowerCase().includes(searchLower) ||
             conv.friend.full_name?.toLowerCase().includes(searchLower);
    } else if (conv.type === 'group' && conv.group) {
      return conv.group.name.toLowerCase().includes(searchLower);
    }
    return false;
  });

  const friendConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "friend");
  const matchConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "match");
  const otherConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "other");
  const groupConversations = filteredConversations.filter(c => c.type === 'group');

  const friendUnreadCount = friendConversations.filter(c => c.unreadCount > 0).length;
  const matchUnreadCount = matchConversations.filter(c => c.unreadCount > 0).length;
  const otherUnreadCount = otherConversations.filter(c => c.unreadCount > 0).length;

  const ConversationItem = ({ conv, selected, onClick }: any) => {
    const isGroup = conv.type === 'group';
    const displayName = isGroup ? conv.group?.name : (conv.friend?.full_name || conv.friend?.username);
    const displayPhoto = isGroup ? conv.group?.photo_url : conv.friend?.profile_photo;
    const displayUsername = isGroup ? `${conv.group?.member_count || 0} üye` : `@${conv.friend?.username}`;
    
    const lastMessageText = isGroup 
      ? (conv.lastMessage ? `${conv.lastMessageSenderName}: ${conv.lastMessage.content}` : "Henüz mesaj yok")
      : (conv.lastMessage?.content || "");
    
    const lastMessageTime = conv.lastMessage?.created_at 
      ? formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true, locale: tr })
      : "";

    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 relative ${
          selected ? "bg-accent" : ""
        }`}
        onClick={onClick}
      >
        {conv.isPinned && (
          <Pin className="absolute top-2 right-2 w-3 h-3 text-primary" />
        )}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={displayPhoto || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {isGroup ? <Users className="w-6 h-6" /> : displayName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isGroup && conv.friend?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-medium truncate">{displayName}</p>
              <span className="text-xs text-muted-foreground">{lastMessageTime}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{displayUsername}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {lastMessageText.substring(0, 50)}
              </p>
              {conv.unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs ml-2">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MessageSearchResultItem = ({ result }: { result: MessageSearchResult }) => {
    const isGroup = result.conversationType === 'group';
    const displayName = isGroup 
      ? result.group?.name 
      : (result.friend?.full_name || result.friend?.username);
    const displayPhoto = isGroup ? result.group?.photo_url : result.friend?.profile_photo;
    
    const messageTime = formatDistanceToNow(new Date(result.message.created_at), { 
      addSuffix: true, 
      locale: tr 
    });

    const handleClick = () => {
      if (isGroup) {
        navigate(`/groups/${result.conversationId}`);
      } else if (result.friend) {
        onConversationSelect(result.friend, result.message.message_category);
        onSearchModeChange("conversations");
        onSearchQueryChange("");
      }
    };

    const highlightText = (text: string) => {
      if (!searchQuery) return text;
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() 
          ? <mark key={i} className="bg-primary/20">{part}</mark>
          : part
      );
    };

    return (
      <div
        className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={displayPhoto || undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
              {isGroup ? <Users className="w-5 h-5" /> : displayName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <span className="text-xs text-muted-foreground">{messageTime}</span>
            </div>
            <p className="text-sm text-foreground/80 line-clamp-2">
              {highlightText(result.message.content)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`md:col-span-1 p-4 ${isMobile && selectedFriend ? 'hidden' : ''}`}>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchMode === "conversations" ? "Konuşmalarda ara..." : "Mesajlarda ara..."}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={searchMode === "conversations" ? "default" : "outline"}
            size="sm"
            onClick={() => onSearchModeChange("conversations")}
            className="flex-1 text-xs"
          >
            Konuşmalar
          </Button>
          <Button
            variant={searchMode === "messages" ? "default" : "outline"}
            size="sm"
            onClick={() => onSearchModeChange("messages")}
            className="flex-1 text-xs"
          >
            Mesajlar
          </Button>
        </div>
      </div>

      {/* Message Search Results */}
      {searchMode === "messages" && searchQuery && (
        <ScrollArea className="h-[calc(100vh-380px)]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messageSearchResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                "{searchQuery}" için sonuç bulunamadı
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1 mb-2">
                {messageSearchResults.length} mesaj bulundu
              </p>
              {messageSearchResults.map((result, idx) => (
                <MessageSearchResultItem key={idx} result={result} />
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Conversation Tabs */}
      {searchMode === "conversations" && (
        <Tabs value={activeTab} onValueChange={(v: any) => onActiveTabChange(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="friends" className="text-xs">
              Arkadaş
              {friendUnreadCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                  {friendUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="matches" className="text-xs">
              Eşleşme
              {matchUnreadCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                  {matchUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              Gruplar
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs">
              Diğer
              {otherUnreadCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                  {otherUnreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {friendConversations.length === 0 ? (
                  <div className="py-8 px-4">
                    <EmptyState
                      icon={UserPlus}
                      title="Mesaj yok"
                      description="Henüz arkadaşlarınızdan mesaj almadınız. Yeni arkadaşlar bulun ve sohbete başlayın!"
                      actionLabel="Arkadaş Bul"
                      onAction={() => navigate("/discovery")}
                      illustration={<NoMessagesIllustration />}
                      variant="gradient"
                    />
                  </div>
                ) : (
                  friendConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <ConversationItem
                        conv={conv}
                        selected={selectedFriend?.user_id === conv.id}
                        onClick={() => onConversationSelect(conv.friend!, conv.category!)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinConversation(conv);
                        }}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matches" className="mt-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {matchConversations.length === 0 ? (
                  <div className="py-8 px-4">
                    <EmptyState
                      icon={Heart}
                      title="Eşleşme yok"
                      description="Henüz eşleşmenizden mesaj almadınız. Match bölümünden yeni insanlarla eşleşin!"
                      actionLabel="Eşleşmeleri Gör"
                      onAction={() => navigate("/match")}
                    />
                  </div>
                ) : (
                  matchConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <ConversationItem
                        conv={conv}
                        selected={selectedFriend?.user_id === conv.id}
                        onClick={() => onConversationSelect(conv.friend!, conv.category!)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinConversation(conv);
                        }}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {groupConversations.length === 0 ? (
                  <div className="py-8 px-4">
                    <EmptyState
                      icon={Users}
                      title="Grup yok"
                      description="Henüz hiçbir gruba üye değilsiniz. Grup oluşturun veya gruplara katılın!"
                      actionLabel="Gruplara Git"
                      onAction={() => navigate("/groups")}
                    />
                  </div>
                ) : (
                  groupConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <ConversationItem
                        conv={conv}
                        selected={false}
                        onClick={() => navigate(`/groups/${conv.id}`)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinConversation(conv);
                        }}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="other" className="mt-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-2">
                {otherConversations.length === 0 ? (
                  <div className="py-8 px-4">
                    <EmptyState
                      icon={MessageSquare}
                      title="Mesaj yok"
                      description="Henüz diğer mesajlarınız yok."
                    />
                  </div>
                ) : (
                  otherConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <ConversationItem
                        conv={conv}
                        selected={selectedFriend?.user_id === conv.id}
                        onClick={() => onConversationSelect(conv.friend!, conv.category!)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinConversation(conv);
                        }}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
};
