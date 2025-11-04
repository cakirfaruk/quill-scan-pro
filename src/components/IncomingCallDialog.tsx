import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useState } from "react";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <Avatar className="w-24 h-24">
            <AvatarImage src={callerPhoto} alt={callerName} />
            <AvatarFallback>{callerName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{callerName}</h3>
            <p className="text-muted-foreground">
              {callType === "video" ? "Görüntülü" : "Sesli"} arama geliyor...
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              onClick={handleReject}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
              onClick={handleAccept}
            >
              {callType === "video" ? (
                <Video className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
