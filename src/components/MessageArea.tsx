import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, Phone, Video, Ban, MessageSquare } from "lucide-react";
import { OptimizedMessageList } from "@/components/OptimizedMessageList";
import { TypingIndicator } from "@/components/TypingIndicator";
import { AnimatePresence } from "framer-motion";
import { NoConversationIllustration } from "@/components/EmptyStateIllustrations";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  message_category: "friend" | "match" | "other";
  analysis_id?: string;
  analysis_type?: string;
  pinned_at?: string | null;
  forwarded_from?: string | null;
  reply_to?: string | null;
  replied_message?: Message | null;
}

interface MessageAreaProps {
  selectedFriend: Friend | null;
  selectedCategory: "friend" | "match" | "other" | null;
  messages: Message[];
  pinnedMessages: Message[];
  currentUserId: string;
  isMobile: boolean;
  isOtherUserTyping: boolean;
  translatedMessages: Record<string, { text: string; sourceLanguage?: string }>;
  showTranslation: Record<string, boolean>;
  translatingMessageId: string | null;
  preferredLanguage: string;
  autoTranslateEnabled: boolean;
  languageNames: Record<string, string>;
  onDeselectFriend: () => void;
  onStartCall: (type: "audio" | "video") => void;
  onReplyToMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onForwardMessage: (messageId: string) => void;
  onTranslateMessage: (messageId: string, content: string) => void;
  onAnalysisClick: (analysis: any) => void;
  setShowTranslation: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const MessageArea = ({
  selectedFriend,
  selectedCategory,
  messages,
  pinnedMessages,
  currentUserId,
  isMobile,
  isOtherUserTyping,
  translatedMessages,
  showTranslation,
  translatingMessageId,
  preferredLanguage,
  autoTranslateEnabled,
  languageNames,
  onDeselectFriend,
  onStartCall,
  onReplyToMessage,
  onDeleteMessage,
  onPinMessage,
  onForwardMessage,
  onTranslateMessage,
  onAnalysisClick,
  setShowTranslation,
}: MessageAreaProps) => {
  const navigate = useNavigate();

  return (
    <Card className={`md:col-span-2 flex flex-col ${isMobile && !selectedFriend ? 'hidden' : ''}`}>
      {selectedFriend ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeselectFriend}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="relative">
              <Avatar 
                className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => {
                  if (selectedCategory === "other") {
                    navigate(`/match?userId=${selectedFriend.user_id}`);
                  } else {
                    navigate(`/profile/${selectedFriend.username}`);
                  }
                }}
              >
                <AvatarImage src={selectedFriend.profile_photo} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {selectedFriend.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedFriend.is_online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
              onClick={() => {
                if (selectedCategory === "other") {
                  navigate(`/match?userId=${selectedFriend.user_id}`);
                } else {
                  navigate(`/profile/${selectedFriend.username}`);
                }
              }}
            >
              <p className="font-medium">
                {selectedFriend.full_name || selectedFriend.username}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">@{selectedFriend.username}</p>
                {selectedFriend.is_online ? (
                  <span className="text-xs text-green-500">• Çevrimiçi</span>
                ) : selectedFriend.last_seen && (
                  <span className="text-xs text-muted-foreground">
                    • {(() => {
                      const diff = Date.now() - new Date(selectedFriend.last_seen).getTime();
                      const minutes = Math.floor(diff / 60000);
                      const hours = Math.floor(minutes / 60);
                      const days = Math.floor(hours / 24);
                      if (days > 0) return `${days} gün önce`;
                      if (hours > 0) return `${hours} saat önce`;
                      if (minutes > 0) return `${minutes} dk önce`;
                      return 'Az önce';
                    })()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedCategory !== "other" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall("audio")}
                    title="Sesli Arama"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall("video")}
                    title="Görüntülü Arama"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
            
            {selectedCategory === "other" && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Ban className="w-3 h-3" />
                <span>Cevap verilemez</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden will-change-transform p-4">
            <OptimizedMessageList
                messages={messages}
                currentUserId={currentUserId}
                selectedFriend={selectedFriend}
                pinnedMessages={pinnedMessages}
                translatedMessages={translatedMessages}
                showTranslation={showTranslation}
                translatingMessageId={translatingMessageId}
                preferredLanguage={preferredLanguage}
                autoTranslateEnabled={autoTranslateEnabled}
                languageNames={languageNames}
                onReplyToMessage={onReplyToMessage}
                onDeleteMessage={onDeleteMessage}
                onPinMessage={onPinMessage}
                onForwardMessage={onForwardMessage}
                onTranslateMessage={onTranslateMessage}
                onAnalysisClick={onAnalysisClick}
                setShowTranslation={setShowTranslation}
              />

              {/* Typing Indicator */}
              <AnimatePresence>
                {isOtherUserTyping && <TypingIndicator />}
              </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full p-8">
          <EmptyState
            icon={MessageSquare}
            title="Bir konuşma seçin"
            description="Mesajlaşmaya başlamak için sol taraftan bir kişi veya grup seçin. Yeni arkadaşlar edinmek için keşfet bölümünü ziyaret edebilirsiniz."
            actionLabel="Arkadaş Bul"
            onAction={() => navigate("/discovery")}
            illustration={<NoConversationIllustration />}
            variant="gradient"
          />
        </div>
      )}
    </Card>
  );
};
