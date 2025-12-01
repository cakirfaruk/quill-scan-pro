import { useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Share2, MessageCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface LongPressShareMenuProps {
  children: React.ReactNode;
  content: string;
  sectionTitle: string;
  analysisType?: string;
  analysisResult?: any;
  analysisId?: string;
}

export const LongPressShareMenu = ({
  children,
  content,
  sectionTitle,
  analysisType,
  analysisResult,
  analysisId,
}: LongPressShareMenuProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(`${sectionTitle}\n\n${content}`);
    toast({
      title: "Kopyalandı",
      description: "Bu bölüm panoya kopyalandı",
    });
  };

  const handleShareToFeed = async () => {
    if (!analysisType) return;
    
    setIsSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Hata",
          description: "Paylaşmak için giriş yapmalısınız",
          variant: "destructive",
        });
        return;
      }

      const shareData = {
        user_id: user.id,
        content: `${sectionTitle}\n\n${content}`,
        analysis_type: analysisType,
        analysis_data: { ...analysisResult, selectedSection: { title: sectionTitle, content } },
      };

      const { error } = await supabase.from("posts").insert([shareData]);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Analiz feed'e paylaşıldı",
      });
      setShowFeedDialog(false);
    } catch (error) {
      console.error("Error sharing to feed:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("friends")
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey (
            user_id,
            username,
            avatar_url
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleShareToMessage = async (friendId: string) => {
    if (!analysisId || !analysisType) return;
    
    setIsSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const messageContent = JSON.stringify({
        type: "analysis_share",
        analysisId,
        analysisType,
        title: sectionTitle,
        preview: content.substring(0, 100),
      });

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: messageContent,
        message_category: "analysis",
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Analiz mesaj olarak gönderildi",
      });
      setShowMessageDialog(false);
    } catch (error) {
      console.error("Error sharing to message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const openFeedDialog = () => {
    setShowFeedDialog(true);
  };

  const openMessageDialog = () => {
    loadFriends();
    setShowMessageDialog(true);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="select-text cursor-context-menu">
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleCopyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Bu Bölümü Kopyala
          </ContextMenuItem>
          {analysisType && (
            <>
              <ContextMenuItem onClick={openFeedDialog}>
                <Share2 className="w-4 h-4 mr-2" />
                Feed'de Paylaş
              </ContextMenuItem>
              <ContextMenuItem onClick={openMessageDialog}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Mesajla Paylaş
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Feed Share Dialog */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Feed'de Paylaş</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">{sectionTitle}</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedDialog(false)}
                disabled={isSharing}
              >
                İptal
              </Button>
              <Button onClick={handleShareToFeed} disabled={isSharing}>
                {isSharing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Paylaş
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Share Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mesajla Paylaş</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingFriends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz arkadaşınız yok
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend: any) => (
                  <div
                    key={friend.friend_id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleShareToMessage(friend.friend_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.profiles?.avatar_url} />
                        <AvatarFallback>
                          {friend.profiles?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.profiles?.username}</span>
                    </div>
                    {isSharing && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
