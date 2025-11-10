import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ban, Smile, Paperclip, Send, Loader2, Mic, Image as ImageIcon, Clock, Save } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { VoiceRecorder } from "@/components/VoiceRecorder";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  message_category: "friend" | "match" | "other";
}

interface MessageInputProps {
  selectedFriend: Friend | null;
  selectedCategory: "friend" | "match" | "other" | null;
  currentUserId: string;
  newMessage: string;
  isSending: boolean;
  showEmojiPicker: boolean;
  attachedFile: File | null;
  attachedFilePreview: string | null;
  showVoiceRecorder: boolean;
  replyingTo: Message | null;
  draftInfo?: {
    hasDraft: boolean;
    lastSaved: number | null;
  };
  longPressHandlers: any;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onEmojiClick: (emojiData: EmojiClickData) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  onCancelReply: () => void;
  onSendVoiceMessage: (audioBlob: Blob) => void;
  onOpenGifPicker: () => void;
  onOpenScheduleDialog: () => void;
  setShowEmojiPicker: (show: boolean) => void;
  setShowVoiceRecorder: (show: boolean) => void;
  messageInputRef: React.RefObject<HTMLTextAreaElement>;
}

export const MessageInput = ({
  selectedFriend,
  selectedCategory,
  currentUserId,
  newMessage,
  isSending,
  showEmojiPicker,
  attachedFile,
  showVoiceRecorder,
  replyingTo,
  draftInfo,
  longPressHandlers,
  onMessageChange,
  onSendMessage,
  onEmojiClick,
  onFileSelect,
  onRemoveAttachment,
  onCancelReply,
  onSendVoiceMessage,
  onOpenGifPicker,
  onOpenScheduleDialog,
  setShowEmojiPicker,
  setShowVoiceRecorder,
  messageInputRef,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedFriend) return null;

  if (selectedCategory === "other") {
    return (
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
          <Ban className="w-4 h-4" />
          <p>Bu kişiyle mesajlaşmak için eşleşmeniz veya arkadaş olmanız gerekiyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t space-y-3">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-start gap-2 p-3 bg-primary/5 border-l-2 border-primary rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary mb-1">
              {replyingTo.sender_id === currentUserId ? "Kendine" : selectedFriend?.full_name || selectedFriend?.username}'ye yanıt veriyorsun
            </div>
            <div className="text-sm opacity-70 truncate">
              {replyingTo.content.replace(/\[.*?\]/g, '').substring(0, 60)}
              {replyingTo.content.length > 60 && '...'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      )}
      
      {/* Voice Recorder */}
      {showVoiceRecorder ? (
        <VoiceRecorder
          onSend={onSendVoiceMessage}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      ) : (
        <>
          {/* File Preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveAttachment}
              >
                ✕
              </Button>
            </div>
          )}
          
          <div className="flex gap-1 md:gap-2 items-center">
            {/* Draft indicator - Hidden on mobile */}
            {draftInfo?.hasDraft && draftInfo?.lastSaved && (
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mr-2">
                <Save className="w-3 h-3" />
                <span>
                  {new Date(draftInfo.lastSaved).toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
            
            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" className="h-8 w-8 md:h-10 md:w-10">
                  <Smile className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 border-0" align="start">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </PopoverContent>
            </Popover>

            {/* File Attachment */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={onFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* Message Input */}
            <Textarea
              ref={messageInputRef}
              placeholder="Mesajınızı yazın..."
              value={newMessage}
              onChange={onMessageChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              className="flex-1 min-w-0 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
              {...longPressHandlers}
            />
             
            {/* Additional Options */}
            <div className="flex gap-1 md:gap-2">
              {/* Voice Recorder Button */}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              {/* GIF Picker */}
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                onClick={onOpenGifPicker}
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              
              {/* Schedule Button - Desktop only */}
              {selectedCategory === "friend" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenScheduleDialog}
                  title="Mesaj Zamanla"
                  className="hidden md:flex h-8 w-8 md:h-10 md:w-10"
                >
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              )}
            </div>
            
            {/* Send Button */}
            <Button
              onClick={onSendMessage}
              disabled={(!newMessage.trim() && !attachedFile) || isSending}
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
