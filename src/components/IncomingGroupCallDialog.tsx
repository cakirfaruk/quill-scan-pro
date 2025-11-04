import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video, Users } from "lucide-react";
import { useState } from "react";
import { GroupVideoCallDialog } from "@/components/GroupVideoCallDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IncomingGroupCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  groupCallId: string;
  groupId: string;
  groupName: string;
  groupPhoto?: string;
  callType: "audio" | "video";
  callerName: string;
}

export const IncomingGroupCallDialog = ({
  isOpen,
  onClose,
  callId,
  groupCallId,
  groupId,
  groupName,
  groupPhoto,
  callType,
  callerName,
}: IncomingGroupCallDialogProps) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update participant status to joined
      await supabase
        .from("group_call_participants")
        .update({ 
          status: "joined",
          joined_at: new Date().toISOString(),
        })
        .eq("call_id", groupCallId)
        .eq("user_id", user.id);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update participant status to missed
      await supabase
        .from("group_call_participants")
        .update({ 
          status: "missed",
          left_at: new Date().toISOString(),
        })
        .eq("call_id", groupCallId)
        .eq("user_id", user.id);

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
      <GroupVideoCallDialog
        isOpen={true}
        onClose={onClose}
        callId={callId}
        groupId={groupId}
        groupName={groupName}
        groupPhoto={groupPhoto}
        callType={callType}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <Avatar className="w-24 h-24">
            <AvatarImage src={groupPhoto} alt={groupName} />
            <AvatarFallback>
              <Users className="w-12 h-12" />
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{groupName}</h3>
            <p className="text-muted-foreground mb-1">
              {callerName} bir grup araması başlattı
            </p>
            <p className="text-sm text-muted-foreground">
              {callType === "video" ? "Görüntülü" : "Sesli"} arama
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
