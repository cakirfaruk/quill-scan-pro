import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface VideoCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId?: string;
  friendId?: string;
  friendName?: string;
  friendPhoto?: string;
  isIncoming?: boolean;
}

export const VideoCallDialog = ({
  isOpen,
  onClose,
  callId,
  friendId,
  friendName,
  friendPhoto,
  isIncoming = false,
}: VideoCallDialogProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "active" | "ended">("connecting");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    if (isIncoming && callId) {
      // Answer incoming call
      setupVideoCall();
    } else if (friendId) {
      // Start outgoing call
      initiateCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, callId, friendId]);

  const initiateCall = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !friendId) return;

      const { data, error } = await supabase
        .from("video_calls")
        .insert({
          caller_id: user.id,
          receiver_id: friendId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setupVideoCall();
      
      // Listen for call status changes
      const channel = supabase
        .channel(`call-${data.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "video_calls",
            filter: `id=eq.${data.id}`,
          },
          (payload) => {
            if (payload.new.status === "declined") {
              toast({
                title: "Arama Reddedildi",
                description: "Karşı taraf aramayı reddetti.",
              });
              handleEndCall();
            } else if (payload.new.status === "active") {
              setIsConnected(true);
              setCallStatus("active");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error("Error initiating call:", error);
      toast({
        title: "Arama Başlatılamadı",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const setupVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate connection (in real app, use WebRTC)
      setTimeout(() => {
        setIsConnected(true);
        setCallStatus("active");
        
        if (callId) {
          supabase
            .from("video_calls")
            .update({ status: "active" })
            .eq("id", callId);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Kamera/Mikrofon Erişimi Reddedildi",
        description: "Görüntülü arama için kamera ve mikrofon izni gerekli.",
        variant: "destructive",
      });
      handleEndCall();
    }
  };

  const handleEndCall = async () => {
    try {
      if (callId) {
        await supabase
          .from("video_calls")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
          })
          .eq("id", callId);
      }

      cleanup();
      onClose();
    } catch (error: any) {
      console.error("Error ending call:", error);
    }
  };

  const handleDeclineCall = async () => {
    try {
      if (callId) {
        await supabase
          .from("video_calls")
          .update({ status: "declined" })
          .eq("id", callId);
      }

      cleanup();
      onClose();
    } catch (error: any) {
      console.error("Error declining call:", error);
    }
  };

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const cleanup = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
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
          <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {isIncoming && !isConnected ? (
              <>
                <Button
                  size="lg"
                  variant="default"
                  className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                  onClick={setupVideoCall}
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
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>

                <Button
                  size="lg"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  className="rounded-full w-14 h-14"
                  onClick={toggleVideo}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>
              </>
            )}
          </div>

          {/* Call Status */}
          {callStatus === "active" && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">Arama Aktif</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};