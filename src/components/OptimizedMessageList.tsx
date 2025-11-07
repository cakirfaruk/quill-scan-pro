import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, CheckCheck, Pin, MoreVertical, MessageSquare, FileText, Forward, Loader2, X } from "lucide-react";
import { MessageReactions } from "@/components/MessageReactions";
import { SwipeableMessage } from "@/components/SwipeableMessage";
import { AnalysisMessageCard } from "@/components/AnalysisMessageCard";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";

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

interface OptimizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  selectedFriend: {
    user_id: string;
    username: string;
    full_name: string;
    profile_photo: string;
  };
  pinnedMessages: Message[];
  translatedMessages: Record<string, { text: string; sourceLanguage?: string }>;
  showTranslation: Record<string, boolean>;
  translatingMessageId: string | null;
  preferredLanguage: string;
  autoTranslateEnabled: boolean;
  languageNames: Record<string, string>;
  onReplyToMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onForwardMessage: (messageId: string) => void;
  onTranslateMessage: (messageId: string, content: string) => void;
  onAnalysisClick: (analysisId: string, analysisType: string) => void;
  setShowTranslation: (value: React.SetStateAction<Record<string, boolean>>) => void;
}

export const OptimizedMessageList = memo(({
  messages,
  currentUserId,
  selectedFriend,
  pinnedMessages,
  translatedMessages,
  showTranslation,
  translatingMessageId,
  preferredLanguage,
  autoTranslateEnabled,
  languageNames,
  onReplyToMessage,
  onDeleteMessage,
  onPinMessage,
  onForwardMessage,
  onTranslateMessage,
  onAnalysisClick,
  setShowTranslation,
}: OptimizedMessageListProps) => {
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const [currentMediaType, setCurrentMediaType] = useState<"image" | "video">("image");

  const openMediaViewer = (url: string, type: "image" | "video") => {
    setCurrentMediaUrl(url);
    setCurrentMediaType(type);
    setMediaViewerOpen(true);
  };

  return (
    <>
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/20 rounded-lg p-3 border-l-4 border-primary mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Sabitlenmiş Mesajlar</span>
          </div>
          <div className="space-y-2">
            {pinnedMessages.slice(0, 3).map(pm => (
              <p key={pm.id} className="text-xs text-muted-foreground truncate">
                {pm.content.replace(/\[.*?\]/g, '').substring(0, 50)}...
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          const isAnalysisShare = msg.analysis_id;
          const isVoiceMessage = msg.content.includes("[VOICE_MESSAGE:");
          const isGif = msg.content.includes("[GIF:");
          const hasFilePreview = msg.content.includes("[FILE_PREVIEW:");
          let displayContent = msg.content;
          let filePreview = null;
          let voiceMessageUrl = null;
          let gifUrl = null;

          if (isGif) {
            const gifMatch = msg.content.match(/\[GIF:([^\]]+)\]/);
            if (gifMatch) gifUrl = gifMatch[1];
          }

          if (isVoiceMessage) {
            const voiceMatch = msg.content.match(/\[VOICE_MESSAGE:([^\]]+)\]/);
            if (voiceMatch) voiceMessageUrl = voiceMatch[1];
          }

          if (hasFilePreview) {
            const previewMatch = msg.content.match(/\[FILE_PREVIEW:([^\]]+)\]/);
            if (previewMatch) {
              filePreview = previewMatch[1];
              displayContent = msg.content.replace(/\[FILE_PREVIEW:[^\]]+\]/, "").trim();
            }
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.02,
              }}
            >
              <SwipeableMessage
                onSwipeRight={() => onReplyToMessage(msg)}
                onSwipeLeft={msg.sender_id === currentUserId ? () => onDeleteMessage(msg.id) : undefined}
              >
                <div
                  className={`flex gap-2 group ${
                    msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex flex-col max-w-[85%] min-w-0">
                    {msg.pinned_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Pin className="w-3 h-3" />
                        <span>Sabitlendi</span>
                      </div>
                    )}

                    {/* Replied Message Preview */}
                    {msg.replied_message && (
                      <div
                        className={`text-xs p-2 rounded-t-lg border-l-2 ${
                          msg.sender_id === currentUserId
                            ? "bg-primary/5 border-primary-foreground/30"
                            : "bg-muted/50 border-primary/30"
                        }`}
                      >
                        <div className="font-semibold opacity-70 mb-1">
                          {msg.replied_message.sender_id === currentUserId
                            ? "Sen"
                            : selectedFriend?.full_name || selectedFriend?.username}
                        </div>
                        <div className="opacity-60 truncate">
                          {msg.replied_message.content.replace(/\[.*?\]/g, "").substring(0, 50)}
                          {msg.replied_message.content.length > 50 && "..."}
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    {isAnalysisShare ? (
                      <AnalysisMessageCard
                        content={msg.content}
                        analysisType={msg.analysis_type}
                        timestamp={msg.created_at}
                        isSender={msg.sender_id === currentUserId}
                        messageId={msg.id}
                        currentUserId={currentUserId}
                        onClick={() => {
                          if (msg.analysis_type) {
                            onAnalysisClick(msg.analysis_id!, msg.analysis_type);
                          }
                        }}
                      />
                    ) : isGif && gifUrl ? (
                      <>
                        <div 
                          className="rounded-lg overflow-hidden max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openMediaViewer(gifUrl, "image")}
                        >
                          <img src={gifUrl} alt="GIF" className="w-full h-auto" />
                          <div
                            className={`px-2 py-1 text-xs opacity-70 flex items-center gap-2 ${
                              msg.sender_id === currentUserId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.sender_id === currentUserId && (
                              <span title={msg.read ? "Okundu" : "İletildi"}>
                                {msg.read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                ) : (
                                  <Check className="w-3 h-3 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <MessageReactions messageId={msg.id} currentUserId={currentUserId} />
                      </>
                    ) : isVoiceMessage && voiceMessageUrl ? (
                      <>
                        <div
                          className={`rounded-lg overflow-hidden ${
                            msg.sender_id === currentUserId ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          <div className="p-2">
                            <VoiceMessagePlayer
                              audioUrl={voiceMessageUrl}
                              preferredLanguage={preferredLanguage}
                              autoTranscribe={autoTranslateEnabled}
                              messageId={msg.id}
                            />
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <p className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {msg.sender_id === currentUserId && (
                                <span className="text-xs opacity-70" title={msg.read ? "Okundu" : "İletildi"}>
                                  {msg.read ? (
                                    <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                  ) : (
                                    <Check className="w-3 h-3 inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <MessageReactions messageId={msg.id} currentUserId={currentUserId} />
                      </>
                    ) : (
                      <div
                        className={`max-w-full rounded-lg overflow-hidden ${
                          translatedMessages[msg.id]
                            ? msg.sender_id === currentUserId
                              ? "bg-primary text-primary-foreground ring-2 ring-accent/50 shadow-lg"
                              : "bg-gradient-to-br from-accent/20 to-muted ring-2 ring-accent/30 shadow-lg"
                            : msg.sender_id === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {filePreview && (
                          <div className="relative cursor-pointer" onClick={() => {
                            const isImage = displayContent.startsWith("🖼️ Resim");
                            openMediaViewer(filePreview, isImage ? "image" : "video");
                          }}>
                            {displayContent.startsWith("🖼️ Resim") ? (
                              <img src={filePreview} alt="Shared" className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity" />
                            ) : displayContent.startsWith("🎥 Video") ? (
                              <video src={filePreview} className="w-full max-h-64" />
                            ) : null}
                          </div>
                        )}
                        <div className="px-4 py-2">
                          <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
                          {translatedMessages[msg.id] && (
                            <div className="mt-2 pt-2 border-t border-current/20 animate-in fade-in duration-300">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className="w-3 h-3 opacity-70"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                    />
                                  </svg>
                                  <p className="text-xs opacity-70 font-medium">
                                    {translatedMessages[msg.id].sourceLanguage
                                      ? `${
                                          languageNames[translatedMessages[msg.id].sourceLanguage!] ||
                                          translatedMessages[msg.id].sourceLanguage
                                        } → Türkçe`
                                      : "Otomatik Çeviri"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowTranslation((prev) => ({
                                      ...prev,
                                      [msg.id]: !prev[msg.id],
                                    }))
                                  }
                                  className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                                >
                                  {showTranslation[msg.id] === false ? "Çeviriyi Göster" : "Orijinali Göster"}
                                </Button>
                              </div>
                              {showTranslation[msg.id] !== false && (
                                <p className="text-sm whitespace-pre-wrap break-words font-medium">
                                  {translatedMessages[msg.id].text}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {msg.sender_id === currentUserId && (
                              <span className="text-xs opacity-70" title={msg.read ? "Okundu" : "İletildi"}>
                                {msg.read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                ) : (
                                  <Check className="w-3 h-3 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {!isAnalysisShare && <MessageReactions messageId={msg.id} currentUserId={currentUserId} />}
                  </div>

                  {/* Message Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onReplyToMessage(msg)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Yanıtla
                      </DropdownMenuItem>
                      {!isAnalysisShare && !isVoiceMessage && !isGif && (
                        <DropdownMenuItem
                          onClick={() => onTranslateMessage(msg.id, displayContent)}
                          disabled={translatingMessageId === msg.id}
                        >
                          {translatingMessageId === msg.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="mr-2 h-4 w-4" />
                          )}
                          {translatedMessages[msg.id] ? "Orijinali Göster" : "Çevir"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onPinMessage(msg.id)}>
                        <Pin className="mr-2 h-4 w-4" />
                        {msg.pinned_at ? "Sabitlemeyi Kaldır" : "Sabitle"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onForwardMessage(msg.id)}>
                        <Forward className="mr-2 h-4 w-4" />
                        İlet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SwipeableMessage>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Simple Media Viewer Dialog */}
      <Dialog open={mediaViewerOpen} onOpenChange={setMediaViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMediaViewerOpen(false)}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
            {currentMediaType === "image" ? (
              <img
                src={currentMediaUrl}
                alt="Media"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentMediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

OptimizedMessageList.displayName = "OptimizedMessageList";
