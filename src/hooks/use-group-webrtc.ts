import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  name: string;
  photo?: string;
  stream?: MediaStream;
  isSpeaking?: boolean;
  audioLevel?: number;
}

interface UseGroupWebRTCProps {
  callId: string;
  groupId: string;
  onParticipantsChange?: (participants: Participant[]) => void;
  onCallEnd?: () => void;
}

export const useGroupWebRTC = ({ 
  callId, 
  groupId, 
  onParticipantsChange, 
  onCallEnd 
}: UseGroupWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const currentUserId = useRef<string>('');
  const audioAnalyzersRef = useRef<Map<string, AnalyserNode>>(new Map());

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

    // Subscribe to presence changes
    const channel = supabase.channel(`group-call-${callId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        updateParticipants(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Participant joined:', key, newPresences);
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== currentUserId.current) {
            initializePeerConnection(presence.user_id, presence.name, presence.photo);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Participant left:', key, leftPresences);
        leftPresences.forEach((presence: any) => {
          removePeerConnection(presence.user_id);
        });
      })
      .subscribe();

    subscribeToSignals();

    return () => {
      cleanup();
      supabase.removeChannel(channel);
    };
  }, [callId]);

  useEffect(() => {
    if (onParticipantsChange) {
      onParticipantsChange(participants);
    }
  }, [participants, onParticipantsChange]);

  const updateParticipants = (state: any) => {
    const participantsList: Participant[] = [];
    Object.values(state).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        if (presence.user_id !== currentUserId.current) {
          participantsList.push({
            id: presence.user_id,
            name: presence.name,
            photo: presence.photo,
          });
        }
      });
    });
    setParticipants(participantsList);
  };

  const initializePeerConnection = (userId: string, name: string, photo?: string) => {
    if (peerConnectionsRef.current.has(userId)) return;

    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await supabase.from('call_signals').insert({
          from_user_id: currentUserId.current,
          to_user_id: userId,
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON() as any,
          call_id: callId,
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setParticipants(prev => 
        prev.map(p => p.id === userId ? { ...p, stream } : p)
      );
      
      // Set up audio analysis for speaking detection
      if (stream.getAudioTracks().length > 0) {
        setupAudioAnalyzer(userId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removePeerConnection(userId);
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnectionsRef.current.set(userId, pc);
  };

  const setupAudioAnalyzer = (userId: string, stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    audioAnalyzersRef.current.set(userId, analyser);
    
    // Monitor audio levels
    const monitorAudio = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Update participant speaking status
      setParticipants(prev => 
        prev.map(p => p.id === userId ? { ...p, audioLevel: average, isSpeaking: average > 30 } : p)
      );
      
      // Update active speaker
      if (average > 30) {
        setActiveSpeakerId(userId);
      }
      
      requestAnimationFrame(monitorAudio);
    };
    
    monitorAudio();
  };

  const removePeerConnection = (userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    
    const analyzer = audioAnalyzersRef.current.get(userId);
    if (analyzer) {
      audioAnalyzersRef.current.delete(userId);
    }
    
    setParticipants(prev => prev.filter(p => p.id !== userId));
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

          const pc = peerConnectionsRef.current.get(signal.from_user_id);
          if (!pc) return;

          try {
            if (signal.signal_type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await supabase.from('call_signals').insert({
                from_user_id: currentUserId.current,
                to_user_id: signal.from_user_id,
                signal_type: 'answer',
                signal_data: answer as any,
                call_id: callId,
              });
            } else if (signal.signal_type === 'answer') {
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

  const startCall = async (hasVideo: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: hasVideo,
      });

      setLocalStream(stream);

      // Join the call room
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, profile_photo')
          .eq('user_id', user.id)
          .single();

        const channel = supabase.channel(`group-call-${callId}`);
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              name: profile?.full_name || profile?.username || 'User',
              photo: profile?.profile_photo,
              online_at: new Date().toISOString(),
            });
          }
        });
      }

      // Create offers for existing participants
      participants.forEach(async (participant) => {
        const pc = peerConnectionsRef.current.get(participant.id);
        if (pc) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          await supabase.from('call_signals').insert({
            from_user_id: currentUserId.current,
            to_user_id: participant.id,
            signal_type: 'offer',
            signal_data: offer as any,
            call_id: callId,
          });
        }
      });
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    audioAnalyzersRef.current.clear();
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

      const videoTrack = screenStream.getVideoTracks()[0];
      
      peerConnectionsRef.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      setIsScreenSharing(true);

      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    
    peerConnectionsRef.current.forEach(async (pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    });
    
    setIsScreenSharing(false);
  };

  const endCall = () => {
    cleanup();
    if (onCallEnd) onCallEnd();
  };

  return {
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
  };
};
