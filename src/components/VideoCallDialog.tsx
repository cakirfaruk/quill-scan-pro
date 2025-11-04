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
    if (!isOpen) return;

    if (isIncoming) {
      answerCall(callType === "video");
    } else {
      startCall(callType === "video");
    }

    // Update call log
    updateCallLog("active");
    
    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (isConnected) {
      setCallStatus("active");
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
        .eq("id", callId);
    } catch (error) {
      console.error("Error updating call log:", error);
    }
  };

  async function handleCallEnd() {
    await updateCallLog("completed");
    onClose();
  }

  const handleDeclineCall = async () => {
    try {
      await supabase
        .from("call_logs")
        .update({ status: "missed" })
        .eq("id", callId);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
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
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={friendPhoto} />
                <AvatarFallback className="text-4xl">
                  {friendName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-bold text-white mb-2">{friendName}</h3>
              <p className="text-white/70">
                {isIncoming ? "Gelen arama..." : "Bağlanıyor..."}
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
            {isIncoming && !isConnected ? (
              <>
                <Button
                  size="lg"
                  variant="default"
                  className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                  onClick={() => answerCall(callType === "video")}
                >
                  <Phone className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                  onClick={handleDeclineCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
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
                  onClick={endCall}
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
