import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGroupWebRTC } from "@/hooks/use-group-webrtc";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MonitorUp, Grid3x3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupVideoCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  groupId: string;
  groupName: string;
  groupPhoto?: string;
  callType: "audio" | "video";
}

type ViewMode = "grid" | "speaker";

export const GroupVideoCallDialog = ({
  isOpen,
  onClose,
  callId,
  groupId,
  groupName,
  groupPhoto,
  callType,
}: GroupVideoCallDialogProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const {
    localStream,
    participants,
    activeSpeakerId,
    isConnected,
    isMuted,
    isVideoOff,
    isScreenSharing,
    startCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    endCall,
  } = useGroupWebRTC({
    callId,
    groupId,
    onCallEnd: handleCallEnd,
  });

  useEffect(() => {
    if (!isOpen) return;

    startCall(callType === "video");
    
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
    participants.forEach((participant) => {
      if (participant.stream) {
        const videoElement = participantVideoRefs.current.get(participant.id);
        if (videoElement) {
          videoElement.srcObject = participant.stream;
        }
      }
    });
  }, [participants]);

  async function handleCallEnd() {
    onClose();
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getGridColumns = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    if (totalParticipants <= 2) return "grid-cols-1";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  const renderParticipantVideo = (participant: any, isMain: boolean = false) => (
    <div
      key={participant.id}
      className={cn(
        "relative rounded-lg overflow-hidden bg-black",
        isMain ? "w-full h-full" : "",
        participant.isSpeaking && "ring-4 ring-green-500 ring-offset-2"
      )}
    >
      <video
        ref={(el) => {
          if (el) participantVideoRefs.current.set(participant.id, el);
        }}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {!participant.stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Avatar className={cn("w-20 h-20", isMain && "w-32 h-32")}>
            <AvatarImage src={participant.photo} />
            <AvatarFallback className="text-2xl">
              {participant.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
        <p className="text-white text-sm font-medium">{participant.name}</p>
      </div>

      {participant.isSpeaking && (
        <div className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full">
          <p className="text-white text-xs font-bold">Konuşuyor</p>
        </div>
      )}
    </div>
  );

  const renderLocalVideo = (isMain: boolean = false) => (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden bg-black",
        isMain ? "w-full h-full" : ""
      )}
    >
      {callType === "video" && !isVideoOff ? (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Avatar className={cn("w-20 h-20", isMain && "w-32 h-32")}>
            <AvatarImage src={groupPhoto} />
            <AvatarFallback className="text-2xl">Siz</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
        <p className="text-white text-sm font-medium">Siz</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <div className="relative w-full h-full bg-gradient-to-br from-background to-secondary/20 rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={groupPhoto} />
                  <AvatarFallback>
                    {groupName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-white">{groupName}</h3>
                  <p className="text-sm text-white/70">
                    {participants.length + 1} katılımcı • {formatDuration(callDuration)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "secondary"}
                  onClick={() => setViewMode("grid")}
                  className="gap-2"
                >
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "speaker" ? "default" : "secondary"}
                  onClick={() => setViewMode("speaker")}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Konuşmacı
                </Button>
              </div>
            </div>
          </div>

          {/* Video Grid or Speaker View */}
          <div className="flex-1 p-4 pt-24">
            {viewMode === "grid" ? (
              <div className={cn("grid gap-4 h-full", getGridColumns())}>
                {renderLocalVideo()}
                {participants.map((participant) => renderParticipantVideo(participant))}
              </div>
            ) : (
              <div className="h-full flex flex-col gap-4">
                {/* Main Speaker View */}
                <div className="flex-1">
                  {activeSpeakerId ? (
                    renderParticipantVideo(
                      participants.find(p => p.id === activeSpeakerId) || participants[0],
                      true
                    )
                  ) : (
                    renderLocalVideo(true)
                  )}
                </div>

                {/* Thumbnail Strip */}
                <div className="h-32 flex gap-2 overflow-x-auto">
                  <div className="w-40 flex-shrink-0">
                    {renderLocalVideo()}
                  </div>
                  {participants.map((participant) => (
                    <div key={participant.id} className="w-40 flex-shrink-0">
                      {renderParticipantVideo(participant)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
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
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-white text-sm font-medium">
                Bağlanıyor...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
