import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { VideoCallDialog } from "@/components/VideoCallDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IncomingCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  callType: "audio" | "video";
}

export const IncomingCallDialog = ({
  isOpen,
  onClose,
  callId,
  callerId,
  callerName,
  callerPhoto,
  callType,
}: IncomingCallDialogProps) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      // Update call status to accepted (will be handled by VideoCallDialog)
      setHasAccepted(true);
    } catch (error) {
      console.error("Error accepting call:", error);
      toast({
        title: "Hata",
        description: "Arama kabul edilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      // Update call status to rejected
      await supabase
        .from("call_logs")
        .update({ 
          status: "rejected",
          ended_at: new Date().toISOString(),
        })
        .eq("call_id", callId);

      onClose();
    } catch (error) {
      console.error("Error rejecting call:", error);
      toast({
        title: "Hata",
        description: "Arama reddedilemedi.",
        variant: "destructive",
      });
    }
  };

  if (hasAccepted) {
    return (
      <VideoCallDialog
        isOpen={true}
        onClose={onClose}
        callId={callId}
        friendId={callerId}
        friendName={callerName}
        friendPhoto={callerPhoto}
        callType={callType}
        isIncoming={true}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="sm:max-w-lg p-0 border-0 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
          
          <div className="relative flex flex-col items-center justify-center gap-8 py-12 px-6">
            {/* Pulsing ring effect */}
            <div className="relative">
              <div className="absolute inset-0 w-32 h-32 rounded-full bg-primary/30 animate-ping" />
              <div className="absolute inset-2 w-28 h-28 rounded-full bg-primary/20 animate-pulse" />
              <Avatar className="relative w-28 h-28 ring-4 ring-primary/50 shadow-2xl">
                <AvatarImage src={callerPhoto} alt={callerName} />
                <AvatarFallback className="text-4xl bg-primary/20">
                  {callerName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">{callerName}</h2>
              <p className="text-lg text-muted-foreground animate-pulse">
                {callType === "video" ? "📹 Görüntülü" : "📞 Sesli"} arama geliyor...
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-8 mt-4">
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-20 h-20 shadow-lg hover:scale-110 transition-transform"
                  onClick={handleReject}
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
                <span className="text-sm text-muted-foreground">Reddet</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  className="rounded-full w-20 h-20 bg-green-500 hover:bg-green-600 shadow-lg hover:scale-110 transition-transform animate-bounce"
                  onClick={handleAccept}
                >
                  {callType === "video" ? (
                    <Video className="w-8 h-8" />
                  ) : (
                    <Phone className="w-8 h-8" />
                  )}
                </Button>
                <span className="text-sm text-green-600 font-semibold">Kabul Et</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
