import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWebRTCProps {
  callId: string;
  receiverId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnd?: () => void;
}

export const useWebRTC = ({ callId, receiverId, onRemoteStream, onCallEnd }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const currentUserId = useRef<string>('');

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) currentUserId.current = user.id;
    });

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await supabase.from('call_signals').insert({
          from_user_id: currentUserId.current,
          to_user_id: receiverId,
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON() as any,
          call_id: callId,
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
      if (onRemoteStream) {
        onRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        if (onCallEnd) onCallEnd();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (hasVideo: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: hasVideo,
      });

      setLocalStream(stream);
      const pc = initializePeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('call_signals').insert({
        from_user_id: currentUserId.current,
        to_user_id: receiverId,
        signal_type: 'offer',
        signal_data: offer as any,
        call_id: callId,
      });

      // Listen for answer and ICE candidates
      subscribeToSignals();
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  };

  const answerCall = async (hasVideo: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: hasVideo,
      });

      setLocalStream(stream);
      const pc = initializePeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Get the offer
      const { data: signals } = await supabase
        .from('call_signals')
        .select('*')
        .eq('call_id', callId)
        .eq('signal_type', 'offer')
        .order('created_at', { ascending: false })
        .limit(1);

      if (signals && signals.length > 0) {
        const offer = signals[0].signal_data as any as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await supabase.from('call_signals').insert({
          from_user_id: currentUserId.current,
          to_user_id: receiverId,
          signal_type: 'answer',
          signal_data: answer as any,
          call_id: callId,
        });

        // Process any ICE candidates that arrived before we were ready
        const { data: iceCandidates } = await supabase
          .from('call_signals')
          .select('*')
          .eq('call_id', callId)
          .eq('signal_type', 'ice-candidate');

        if (iceCandidates) {
          for (const signal of iceCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data as any));
          }
        }
      }

      subscribeToSignals();
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  };

  const subscribeToSignals = () => {
    const channel = supabase
      .channel(`call-signals-${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `call_id=eq.${callId}`,
        },
        async (payload: any) => {
          const signal = payload.new;
          
          if (signal.to_user_id !== currentUserId.current) return;

          const pc = peerConnectionRef.current;
          if (!pc) return;

          try {
            if (signal.signal_type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
            } else if (signal.signal_type === 'ice-candidate') {
              await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
            }
          } catch (error) {
            console.error('Error processing signal:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const pc = peerConnectionRef.current;
      if (!pc || !localStream) return;

      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
        setIsScreenSharing(true);

        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!localStream || !peerConnectionRef.current) return;

    const videoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
    
    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
      setIsScreenSharing(false);
    }
  };

  const endCall = () => {
    cleanup();
    if (onCallEnd) onCallEnd();
  };

  return {
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
  };
};
