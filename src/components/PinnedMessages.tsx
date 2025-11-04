import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PinnedMessage {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  sender: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  isAdmin: boolean;
  onUnpin: (messageId: string) => void;
  onMessageClick: (messageId: string) => void;
}

export const PinnedMessages = ({ messages, isAdmin, onUnpin, onMessageClick }: PinnedMessagesProps) => {
  if (messages.length === 0) return null;

  return (
    <Card className="mx-4 mt-4 p-3 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Sabitlenmiş Mesajlar</span>
      </div>
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
              onClick={() => onMessageClick(msg.id)}
            >
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={msg.sender.profile_photo || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {msg.sender.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {msg.sender.full_name || msg.sender.username}
                </p>
                <p className="text-sm truncate">
                  {msg.media_url ? (
                    <span className="text-muted-foreground">
                      {msg.media_url.includes("image") ? "📷 Fotoğraf" : "🎥 Video"}
                      {msg.content && `: ${msg.content}`}
                    </span>
                  ) : (
                    msg.content
                  )}
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpin(msg.id);
                  }}
                  title="Sabitlemeyi Kaldır"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
