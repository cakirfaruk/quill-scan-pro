import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, MonitorUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useWebRTC } from "@/hooks/use-webrtc";

interface VideoCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  friendId: string;
  friendName: string;
  friendPhoto?: string;
  isIncoming?: boolean;
  callType: "audio" | "video";
}

export const VideoCallDialog = ({
  isOpen,
  onClose,
  callId,
  friendId,
  friendName,
  friendPhoto,
  isIncoming = false,
  callType,
}: VideoCallDialogProps) => {
  const [callStatus, setCallStatus] = useState<"connecting" | "active" | "ended">("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime] = useState(new Date());
  const [isCallAccepted, setIsCallAccepted] = useState(!isIncoming); // Auto-accept for outgoing calls
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    isScreenSharing,
    startCall,
    answerCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    endCall,
  } = useWebRTC({
    callId,
    receiverId: friendId,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },
    onCallEnd: handleCallEnd,
  });

  useEffect(() => {
    if (!isOpen || !isCallAccepted) return;

    console.log("Starting call...", { isIncoming, callType });
    
    if (isIncoming) {
      console.log("Answering incoming call...");
      answerCall(callType === "video");
    } else {
      console.log("Starting outgoing call...");
      startCall(callType === "video");
    }
    
    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, isCallAccepted]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (isConnected) {
      console.log("WebRTC connection established, updating call status to active");
      setCallStatus("active");
      updateCallLog("active");
    }
  }, [isConnected]);

  const updateCallLog = async (status: string) => {
    try {
      await supabase
        .from("call_logs")
        .update({
          status,
          ended_at: status === "completed" ? new Date().toISOString() : null,
          duration: status === "completed" ? callDuration : 0,
          has_video: callType === "video",
        })
        .eq("call_id", callId);
      
      console.log("Call log updated:", { callId, status });
    } catch (error) {
      console.error("Error updating call log:", error);
    }
  };

  async function handleCallEnd() {
    console.log("Handling call end...");
    await updateCallLog("completed");
    endCall();
    onClose();
  }

  const handleAcceptCall = async () => {
    console.log("Call accepted by user");
    try {
      await supabase
        .from("call_logs")
        .update({ status: "accepted" })
        .eq("call_id", callId);

      setIsCallAccepted(true);
    } catch (error) {
      console.error("Error accepting call:", error);
      toast({
        title: "Hata",
        description: "Arama kabul edilemedi",
        variant: "destructive",
      });
    }
  };

  const handleDeclineCall = async () => {
    console.log("Call declined by user");
    try {
      await supabase
        .from("call_logs")
        .update({ 
          status: "rejected",
          ended_at: new Date().toISOString(),
        })
        .eq("call_id", callId);

      endCall();
      onClose();
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    console.log('Closing video call dialog...');
    endCall();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <DialogContent 
        className="max-w-4xl h-[600px] p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {/* Remote Video (Full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Placeholder when no remote video */}
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <div className="relative">
                {isIncoming && !isCallAccepted && (
                  <>
                    <div className="absolute inset-0 w-32 h-32 rounded-full bg-primary/30 animate-ping" />
                    <div className="absolute inset-2 w-28 h-28 rounded-full bg-primary/20 animate-pulse" />
                  </>
                )}
                <Avatar className="relative w-32 h-32 mb-4 ring-4 ring-primary/50">
                  <AvatarImage src={friendPhoto} />
                  <AvatarFallback className="text-4xl">
                    {friendName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{friendName}</h3>
              <p className="text-white/70 animate-pulse text-lg">
                {isIncoming && !isCallAccepted
                  ? `${callType === "video" ? "📹 Görüntülü" : "📞 Sesli"} arama geliyor...`
                  : "Bağlanıyor..."}
              </p>
            </div>
          )}

          {/* Local Video (Picture in Picture) */}
          {callType === "video" && !isVideoOff && (
            <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {isIncoming && !isCallAccepted ? (
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full w-20 h-20 shadow-lg hover:scale-110 transition-transform"
                    onClick={handleDeclineCall}
                  >
                    <PhoneOff className="w-8 h-8" />
                  </Button>
                  <span className="text-sm text-white/70">Reddet</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    className="rounded-full w-20 h-20 bg-green-500 hover:bg-green-600 shadow-lg hover:scale-110 transition-transform animate-bounce"
                    onClick={handleAcceptCall}
                  >
                    {callType === "video" ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                  </Button>
                  <span className="text-sm text-green-400 font-semibold">Kabul Et</span>
                </div>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  className="rounded-full w-14 h-14"
                  onClick={toggleMute}
                  title={isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {callType === "video" && (
                  <>
                    <Button
                      size="lg"
                      variant={isVideoOff ? "destructive" : "secondary"}
                      className="rounded-full w-14 h-14"
                      onClick={toggleVideo}
                      title={isVideoOff ? "Kamerayı Aç" : "Kamerayı Kapat"}
                    >
                      {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>

                    <Button
                      size="lg"
                      variant={isScreenSharing ? "default" : "secondary"}
                      className="rounded-full w-14 h-14"
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      title={isScreenSharing ? "Ekran Paylaşımını Durdur" : "Ekran Paylaş"}
                    >
                      <MonitorUp className="w-5 h-5" />
                    </Button>
                  </>
                )}

                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                  onClick={handleClose}
                  title="Aramayı Sonlandır"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>

          {/* Call Status & Duration */}
          {callStatus === "active" && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">
                Arama Aktif • {formatDuration(callDuration)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
