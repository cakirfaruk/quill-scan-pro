import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CallInterfaceProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  callType: "audio" | "video";
  onEnd: () => void;
}

export const CallInterface = ({
  receiverId,
  receiverName,
  receiverAvatar,
  callType,
  onEnd,
}: CallInterfaceProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date>(new Date());
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeCall();
    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      const configuration: RTCConfiguration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer through signaling
          console.log("ICE candidate:", event.candidate);
        }
      };

      toast({
        title: "Arama Başlatılıyor",
        description: `${receiverName} ile bağlantı kuruluyor...`,
      });
    } catch (error) {
      console.error("Error initializing call:", error);
      toast({
        title: "Hata",
        description: "Kamera veya mikrofon erişimi sağlanamadı",
        variant: "destructive",
      });
      onEnd();
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);
          setIsScreenSharing(true);

          videoTrack.onended = () => {
            toggleScreenShare();
          };
        }
      } else {
        const videoTrack = localStream?.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
          setIsScreenSharing(false);
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast({
        title: "Hata",
        description: "Ekran paylaşımı başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("call_logs").insert({
          caller_id: user.id,
          receiver_id: receiverId,
          call_type: callType,
          duration: callDuration,
          status: "completed",
          ended_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error logging call:", error);
    }

    cleanup();
    onEnd();
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={receiverAvatar} />
              <AvatarFallback>{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{receiverName}</h3>
              <p className="text-xs text-muted-foreground">{formatDuration(callDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Picture in Picture) */}
        {isVideoEnabled && (
          <Card className="absolute top-4 right-4 w-32 h-40 overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </Card>
        )}

        {/* No video placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src={receiverAvatar} />
              <AvatarFallback className="text-4xl">{receiverName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-card border-t border-border">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6 text-destructive" />
            )}
          </Button>

          {callType === "video" && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-14 h-14"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6 text-destructive" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={toggleScreenShare}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6" />
            ) : (
              <Monitor className="w-6 h-6" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={endCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};