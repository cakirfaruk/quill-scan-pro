import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/hooks/use-draft";
import { Loader2, Send, Search, ArrowLeft, FileText, Smile, Paperclip, Ban, Check, CheckCheck, Mic, Image as ImageIcon, Pin, Forward, MoreVertical, Users, Phone, Video, Clock, MessageSquare, UserPlus, Heart, Save } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { AnalysisMessageCard } from "@/components/AnalysisMessageCard";
import { useIsMobile } from "@/hooks/use-mobile";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { soundEffects } from "@/utils/soundEffects";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VoiceMessagePlayer } from "@/components/VoiceMessagePlayer";
import { MessageReactions } from "@/components/MessageReactions";
import { GifPicker } from "@/components/GifPicker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SwipeableMessage } from "@/components/SwipeableMessage";
import { useLongPress } from "@/hooks/use-gestures";
import { VideoCallDialog } from "@/components/VideoCallDialog";
import { ScheduleMessageDialog } from "@/components/ScheduleMessageDialog";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { playRingtone, vibrate, vibrateShort, showBrowserNotification } from "@/utils/callNotifications";
import { requestNotificationPermission, subscribeToPushNotifications, checkNotificationPermission } from "@/utils/pushNotifications";
import { SkeletonConversationList } from "@/components/SkeletonConversation";
import { EmptyState } from "@/components/ui/empty-state";
import { NoMessagesIllustration, NoConversationIllustration } from "@/components/EmptyStateIllustrations";

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  profile_photo: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  member_count?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  message_category: "friend" | "match" | "other";
  analysis_id?: string;
  analysis_type?: string;
  pinned_at?: string | null;
  forwarded_from?: string | null;
  reply_to?: string | null;
  replied_message?: Message | null;
}

interface Conversation {
  type: 'direct' | 'group';
  id: string;
  friend?: Friend;
  group?: Group;
  lastMessage?: any;
  lastMessageSenderName?: string;
  unreadCount: number;
  category?: "friend" | "match" | "other";
  isPinned?: boolean;
}

interface MessageSearchResult {
  message: Message;
  conversationId: string;
  conversationType: 'direct' | 'group';
  friend?: Friend;
  group?: Group;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"friend" | "match" | "other" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"conversations" | "messages">("conversations");
  const [messageSearchResults, setMessageSearchResults] = useState<MessageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "matches" | "other" | "groups">("friends");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    callId: string;
    callerId: string;
    callerName: string;
    callerPhoto?: string;
    callType: "audio" | "video";
  } | null>(null);
  const [ringtone, setRingtone] = useState<{ stop: () => void } | null>(null);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, { text: string; sourceLanguage?: string }>>({});
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  
  // Language name mapping
  const languageNames: Record<string, string> = {
    'en': 'İngilizce',
    'tr': 'Türkçe',
    'es': 'İspanyolca',
    'fr': 'Fransızca',
    'de': 'Almanca',
    'ar': 'Arapça',
    'zh': 'Çince',
    'ja': 'Japonca',
    'ko': 'Korece',
    'pt': 'Portekizce',
    'ru': 'Rusça',
    'it': 'İtalyanca'
  };
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('tr');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Draft management - unique key for each conversation
  const draftKey = selectedFriend 
    ? `message_${currentUserId}_${selectedFriend.user_id}`
    : selectedCategory
    ? `message_${currentUserId}_${selectedCategory}`
    : `message_${currentUserId}_general`;

  const draft = useDraft({
    key: draftKey,
    maxLength: 2000,
    autoSaveDelay: 1500,
    onRestore: (draftContent) => setNewMessage(draftContent),
  });

  // Long press handler for mobile menu
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (isMobile) {
        setShowMobileMenu(true);
      }
    },
    delay: 500,
  });

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Broadcast typing status
    if (typingChannelRef.current && selectedFriend) {
      typingChannelRef.current.track({
        user_id: currentUserId,
        typing: true,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannelRef.current) {
          typingChannelRef.current.track({
            user_id: currentUserId,
            typing: false,
          });
        }
      }, 2000);
    }
    
    // Auto-resize
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 120)}px`;
    }
  };

  // Auto-save draft when message changes
  useEffect(() => {
    if (!newMessage.trim() || !selectedFriend) return;
    
    const cleanup = draft.autoSave(newMessage);
    return cleanup;
  }, [newMessage, selectedFriend]);

  // Load draft when conversation changes
  useEffect(() => {
    if (selectedFriend && draft.hasDraft) {
      const restored = draft.loadDraft();
      if (restored) {
        setNewMessage(restored);
      }
    } else {
      setNewMessage("");
    }
  }, [selectedFriend?.user_id, selectedCategory]);

  useEffect(() => {
    loadConversations();

    // Check for pending incoming call (from push notification URL)
    const checkPendingCall = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check URL parameters for call ID
      const urlParams = new URLSearchParams(window.location.search);
      const urlCallId = urlParams.get('callId');
      
      if (urlCallId) {
        // Load call from database
        const { data: call } = await supabase
          .from('call_logs')
          .select('*')
          .eq('call_id', urlCallId)
          .eq('receiver_id', user.id)
          .eq('status', 'ringing')
          .maybeSingle();

        if (call) {
          // Load caller profile
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo')
            .eq('user_id', call.caller_id)
            .maybeSingle();

          if (callerProfile) {
            // Play ringtone
            const audio = playRingtone();
            setRingtone(audio);
            
            // Vibrate
            vibrate();

            setIncomingCall({
              id: call.id,
              callId: call.call_id,
              callerId: call.caller_id,
              callerName: callerProfile.full_name || callerProfile.username,
              callerPhoto: callerProfile.profile_photo,
              callType: call.call_type as "audio" | "video",
            });
          }
        }
      } else {
        // Check for any pending calls in the database
        const { data: pendingCalls } = await supabase
          .from('call_logs')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('status', 'ringing')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingCalls && pendingCalls.length > 0) {
          const call = pendingCalls[0];
          
          // Load caller profile
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo')
            .eq('user_id', call.caller_id)
            .maybeSingle();

          if (callerProfile) {
            // Play ringtone
            const audio = playRingtone();
            setRingtone(audio);
            
            // Vibrate
            vibrate();

            setIncomingCall({
              id: call.id,
              callId: call.call_id,
              callerId: call.caller_id,
              callerName: callerProfile.full_name || callerProfile.username,
              callerPhoto: callerProfile.profile_photo,
              callType: call.call_type as "audio" | "video",
            });
          }
        }
      }
    };

    checkPendingCall();

    // Request notification permission and subscribe to push notifications
    const setupPushNotifications = async () => {
      const permission = checkNotificationPermission();
      
      if (permission === 'default') {
        // Ask for permission
        const granted = await requestNotificationPermission();
        if (granted) {
          const subscribed = await subscribeToPushNotifications();
          setPushNotificationsEnabled(subscribed);
          if (subscribed) {
            toast({
              title: "Bildirimler Aktif",
              description: "Browser arka planda açıkken arama bildirimi alacaksınız",
            });
          }
        }
      } else if (permission === 'granted') {
        // Already granted, just subscribe
        const subscribed = await subscribeToPushNotifications();
        setPushNotificationsEnabled(subscribed);
      }
    };

    setupPushNotifications();
  }, []);

  // Watch for URL parameter changes
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam && currentUserId && userIdParam !== selectedFriend?.user_id) {
      loadConversations();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!currentUserId) return;
    
    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          if (selectedFriend) {
            loadMessages(selectedFriend.user_id);
          }
          loadConversations();
          
          // Auto-translate new incoming message if enabled
          if (payload.eventType === 'INSERT' && autoTranslateEnabled && payload.new) {
            const newMsg = payload.new as any;
            if (newMsg.sender_id !== currentUserId && 
                newMsg.receiver_id === currentUserId &&
                !newMsg.content.includes("[VOICE_MESSAGE:") &&
                !newMsg.content.includes("[GIF:")) {
              
              const displayContent = newMsg.content.replace(/\[FILE_PREVIEW:[^\]]+\]/, "").trim();
              if (displayContent) {
                try {
                  const { data } = await supabase.functions.invoke('translate-message', {
                    body: { 
                      text: displayContent, 
                      targetLanguage: preferredLanguage,
                      detectLanguage: true 
                    }
                  });

                  if (data?.translatedText && data?.needsTranslation) {
                    setTranslatedMessages(prev => ({
                      ...prev,
                      [newMsg.id]: {
                        text: data.translatedText,
                        sourceLanguage: data.detectedLanguage
                      }
                    }));
                    // Show translation by default for auto-translated messages
                    setShowTranslation(prev => ({
                      ...prev,
                      [newMsg.id]: true
                    }));
                  }
                } catch (error) {
                  console.error('Auto-translate error:', error);
                }
              }
            }
          }
        }
      )
      .subscribe();

    const groupMessagesChannel = supabase
      .channel("group-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_messages",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    // Listen for incoming calls
    const incomingCallsChannel = supabase
      .channel(`incoming-calls-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_logs",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const call = payload.new;
          
          console.log("Incoming call detected:", call);
          
          // Only show dialog if status is ringing
          if (call.status === "ringing") {
            // Get caller info
            const { data: callerProfile } = await supabase
              .from("profiles")
              .select("username, full_name, profile_photo")
              .eq("user_id", call.caller_id)
              .maybeSingle();

            if (callerProfile) {
              console.log("Showing incoming call from:", callerProfile);
              
              // Play ringtone
              const audio = playRingtone();
              setRingtone(audio);
              
              // Vibrate
              vibrate();
              
              // Show browser notification (for when browser is open)
              showBrowserNotification(
                `${callerProfile.full_name || callerProfile.username} arıyor`,
                {
                  body: call.call_type === "video" ? "Görüntülü arama" : "Sesli arama",
                  tag: call.call_id,
                }
              );

              // Send push notification (for when browser is closed)
              try {
                await supabase.functions.invoke('send-call-notification', {
                  body: {
                    receiverId: call.receiver_id,
                    callerName: callerProfile.full_name || callerProfile.username || "Bilinmeyen",
                    callerPhoto: callerProfile.profile_photo,
                    callType: call.call_type,
                    callId: call.call_id,
                  },
                });
                console.log('Push notification sent successfully');
              } catch (error) {
                console.error('Error sending push notification:', error);
              }
              
              setIncomingCall({
                id: call.id,
                callId: call.call_id,
                callerId: call.caller_id,
                callerName: callerProfile.full_name || callerProfile.username,
                callerPhoto: callerProfile.profile_photo,
                callType: call.call_type,
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for call status updates (when user accepts)
    const callStatusChannel = supabase
      .channel(`call-status-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_logs",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const call = payload.new;
          
          console.log("Receiver: Call status updated:", call);
          
          // If call is rejected or ended, stop ringtone and close dialog
          if ((call.status === "rejected" || call.status === "ended") && incomingCall?.callId === call.call_id) {
            if (ringtone) {
              ringtone.stop();
              setRingtone(null);
            }
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(groupMessagesChannel);
      supabase.removeChannel(incomingCallsChannel);
      supabase.removeChannel(callStatusChannel);
    };
  }, [selectedFriend, currentUserId]);

  // Typing indicator with Supabase presence
  useEffect(() => {
    if (!selectedFriend || !currentUserId) return;

    const channelName = `typing:${[currentUserId, selectedFriend.user_id].sort().join('-')}`;
    
    // Clean up previous channel if exists
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
    }

    const channel = supabase.channel(channelName);
    typingChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const otherUserPresence = presenceState[selectedFriend.user_id] as any[];
        
        if (otherUserPresence && otherUserPresence[0]?.typing) {
          setIsOtherUserTyping(true);
        } else {
          setIsOtherUserTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            typing: false,
          });
        }
      });

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      setIsOtherUserTyping(false);
    };
  }, [selectedFriend, currentUserId]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Load pinned conversations
      const { data: pinnedData } = await supabase
        .from("conversation_pins")
        .select("conversation_type, conversation_id")
        .eq("user_id", user.id);

      const pinnedMap = new Map<string, boolean>();
      pinnedData?.forEach(pin => {
        pinnedMap.set(`${pin.conversation_type}:${pin.conversation_id}`, true);
      });

      // Get direct message conversations
      const { data: allMessages } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, message_category")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const directConversations: Conversation[] = [];

      if (allMessages && allMessages.length > 0) {
        const userIds = new Set<string>();
        allMessages.forEach(msg => {
          if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
          if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
        });

        if (userIds.size > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, username, full_name, profile_photo, is_online, last_seen")
            .in("user_id", Array.from(userIds));

          const { data: friendsData } = await supabase
            .from("friends")
            .select("user_id, friend_id")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq("status", "accepted");

          const friendIds = new Set<string>();
          friendsData?.forEach(f => {
            if (f.user_id === user.id) friendIds.add(f.friend_id);
            else friendIds.add(f.user_id);
          });

          const { data: userSwipes } = await supabase
            .from("swipes")
            .select("target_user_id, action")
            .eq("user_id", user.id)
            .eq("action", "like");

          const matchIds = new Set<string>();
          if (userSwipes && userSwipes.length > 0) {
            const likedUserIds = userSwipes.map(s => s.target_user_id);
            const { data: mutualSwipes } = await supabase
              .from("swipes")
              .select("user_id")
              .in("user_id", likedUserIds)
              .eq("target_user_id", user.id)
              .eq("action", "like");
            
            mutualSwipes?.forEach(s => matchIds.add(s.user_id));
          }

          const conversationsWithMessages = await Promise.all(
            (profilesData || []).map(async (profile) => {
              let category: "friend" | "match" | "other" = "other";
              if (friendIds.has(profile.user_id)) category = "friend";
              else if (matchIds.has(profile.user_id)) category = "match";

              const { data: lastMsg } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${profile.user_id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${profile.user_id})`)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("sender_id", profile.user_id)
                .eq("receiver_id", user.id)
                .eq("read", false);

              const conversationId = profile.user_id;
              const isPinned = pinnedMap.has(`direct:${conversationId}`);

              return {
                type: 'direct' as const,
                id: conversationId,
                friend: {
                  user_id: profile.user_id,
                  username: profile.username,
                  full_name: profile.full_name,
                  profile_photo: profile.profile_photo,
                  is_online: profile.is_online,
                  last_seen: profile.last_seen,
                },
                lastMessage: lastMsg,
                unreadCount: count || 0,
                category,
                isPinned,
              };
            })
          );

          directConversations.push(...conversationsWithMessages);
        }
      }

      // Get group conversations
      const { data: groupMemberships } = await supabase
        .from("group_members")
        .select(`
          group_id,
          groups (
            id,
            name,
            description,
            photo_url
          )
        `)
        .eq("user_id", user.id);

      const groupConversations: Conversation[] = await Promise.all(
        (groupMemberships || []).map(async (membership: any) => {
          const group = membership.groups;
          if (!group) return null;

          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          const { data: lastMessages } = await supabase
            .from("group_messages")
            .select("*")
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMessage = lastMessages?.[0];
          let lastMessageSenderName = "Bilinmeyen";

          if (lastMessage) {
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("user_id", lastMessage.sender_id)
              .maybeSingle();
            
            lastMessageSenderName = senderProfile?.username || "Bilinmeyen";
          }

          const isPinned = pinnedMap.has(`group:${group.id}`);

          return {
            type: 'group' as const,
            id: group.id,
            group: {
              id: group.id,
              name: group.name,
              description: group.description,
              photo_url: group.photo_url,
              member_count: memberCount || 0,
            },
            lastMessage: lastMessage,
            lastMessageSenderName,
            unreadCount: 0,
            isPinned,
          };
        })
      ).then(results => results.filter(r => r !== null) as Conversation[]);

      // Combine and sort all conversations
      const allConversations = [...directConversations, ...groupConversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const aTime = a.lastMessage?.created_at || "";
        const bTime = b.lastMessage?.created_at || "";
        return bTime.localeCompare(aTime);
      });

      setConversations(allConversations);

      const userIdParam = searchParams.get("userId");      
      if (userIdParam) {
        const conv = allConversations.find(c => c.type === 'direct' && c.friend?.user_id === userIdParam);
        if (conv && conv.friend?.user_id !== selectedFriend?.user_id) {
          setSelectedFriend(conv.friend!);
          setSelectedCategory(conv.category!);
          if (conv.category === "friend") setActiveTab("friends");
          else if (conv.category === "match") setActiveTab("matches");
          else setActiveTab("other");
          loadMessages(conv.friend!.user_id, user.id);
        } else if (!conv) {
          // If user is not in conversations (no messages yet), fetch their profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id, username, full_name, profile_photo, is_online, last_seen")
            .eq("user_id", userIdParam)
            .maybeSingle();
          
          if (profileData) {
            // Check if they're a friend or match
            let category: "friend" | "match" | "other" = "other";
            
            // Check friendship status
            const { data: friendCheck } = await supabase
              .from("friends")
              .select("id")
              .or(`and(user_id.eq.${user.id},friend_id.eq.${userIdParam}),and(user_id.eq.${userIdParam},friend_id.eq.${user.id})`)
              .eq("status", "accepted")
              .maybeSingle();
            
            if (friendCheck) {
              category = "friend";
            } else {
              // Check match status
              const isMatch = await supabase.rpc('check_mutual_match', {
                p_user1_id: user.id,
                p_user2_id: userIdParam
              });
              
              if (isMatch.data) {
                category = "match";
              }
            }
            
            const friendData: Friend = {
              user_id: profileData.user_id,
              username: profileData.username,
              full_name: profileData.full_name,
              profile_photo: profileData.profile_photo,
              is_online: profileData.is_online,
              last_seen: profileData.last_seen,
            };
            
            setSelectedFriend(friendData);
            setSelectedCategory(category);
            if (category === "friend") setActiveTab("friends");
            else if (category === "match") setActiveTab("matches");
            else setActiveTab("other");
            loadMessages(friendData.user_id, user.id);
          }
        }
      }
      
      return { userId: user.id };
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Hata",
        description: "Konuşmalar yüklenemedi.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (friendId: string, userId?: string) => {
    try {
      const effectiveUserId = userId || currentUserId;
      
      if (!effectiveUserId) {
        console.error("No user ID available");
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${friendId},receiver_id.eq.${effectiveUserId}),and(sender_id.eq.${effectiveUserId},receiver_id.eq.${friendId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch replied messages if any
      const replyToIds = data?.filter(m => m.reply_to).map(m => m.reply_to) || [];
      let repliedMessagesMap = new Map<string, any>();

      if (replyToIds.length > 0) {
        const { data: repliedMessages } = await supabase
          .from("messages")
          .select("*")
          .in("id", replyToIds);

        repliedMessages?.forEach(msg => {
          repliedMessagesMap.set(msg.id, msg);
        });
      }

      const parsedMessages = data?.map(msg => {
        const analysisIdMatch = msg.content.match(/\[Analiz ID: ([^\]]+)\]/);
        const analysisTypeMatch = msg.content.match(/\[Analiz Türü: ([^\]]+)\]/);
        
        const baseMsg = {
          ...msg,
          message_category: (msg.message_category || "other") as "friend" | "match" | "other",
          replied_message: msg.reply_to ? repliedMessagesMap.get(msg.reply_to) : null,
        };

        if (analysisIdMatch && analysisTypeMatch) {
          return {
            ...baseMsg,
            analysis_id: analysisIdMatch[1],
            analysis_type: analysisTypeMatch[1],
          };
        }
        return baseMsg;
      }) || [];

      setMessages(parsedMessages);

      const pinnedMsgs = parsedMessages.filter(m => m.pinned_at);
      setPinnedMessages(pinnedMsgs);

      // Auto-translate messages if enabled
      if (autoTranslateEnabled && parsedMessages.length > 0) {
        parsedMessages.forEach(async (msg) => {
          // Only translate messages from other user that are not special types
          if (msg.sender_id !== effectiveUserId && 
              !('analysis_id' in msg) && 
              !msg.content.includes("[VOICE_MESSAGE:") && 
              !msg.content.includes("[GIF:") &&
              !translatedMessages[msg.id]) {
            
            const displayContent = msg.content.replace(/\[FILE_PREVIEW:[^\]]+\]/, "").trim();
            if (displayContent) {
              try {
                const { data } = await supabase.functions.invoke('translate-message', {
                  body: { 
                    text: displayContent, 
                    targetLanguage: preferredLanguage,
                    detectLanguage: true 
                  }
                });

                if (data?.translatedText && data?.needsTranslation) {
                  setTranslatedMessages(prev => ({
                    ...prev,
                    [msg.id]: {
                      text: data.translatedText,
                      sourceLanguage: data.detectedLanguage
                    }
                  }));
                  // Show translation by default for auto-loaded messages
                  setShowTranslation(prev => ({
                    ...prev,
                    [msg.id]: true
                  }));
                }
              } catch (error) {
                console.error('Auto-translate error:', error);
              }
            }
          }
        });
      }

      if (parsedMessages.length === 0) {
        // First time messaging - no error needed
        return;
      }

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", friendId)
        .eq("receiver_id", effectiveUserId)
        .eq("read", false);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      // Don't show error toast for empty conversations
      if (error?.message && !error.message.includes("No rows")) {
        toast({
          title: "Hata",
          description: "Mesajlar yüklenemedi.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalysisClick = async (analysisId: string, analysisType: string) => {
    try {
      let analysisData = null;

      // First check if the analysis is shared with the current user
      const { data: sharedData } = await supabase
        .from("shared_analyses")
        .select("*")
        .eq("analysis_id", analysisId)
        .maybeSingle();

      // Check different tables based on analysis type
      if (analysisType === "compatibility") {
        // For compatibility, check compatibility_analyses table
        const { data } = await supabase
          .from("compatibility_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        
        if (data) {
          analysisData = {
            ...data,
            analysis_type: "compatibility",
          };
        }
      } else if (analysisType === "tarot") {
        // For tarot, check matches table
        const { data } = await supabase
          .from("matches")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        
        if (data?.tarot_reading) {
          analysisData = {
            id: data.id,
            user_id: data.user1_id,
            created_at: data.matched_at,
            result: data.tarot_reading,
            analysis_type: "tarot",
          };
        }
      } else if (analysisType === "numerology") {
        const { data } = await supabase
          .from("numerology_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      } else if (analysisType === "birth_chart") {
        const { data } = await supabase
          .from("birth_chart_analyses")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      } else if (analysisType === "tarot") {
        const { data } = await supabase
          .from("tarot_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "coffee_fortune") {
        const { data } = await supabase
          .from("coffee_fortune_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "dream") {
        const { data } = await supabase
          .from("dream_interpretations")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "palmistry") {
        const { data } = await supabase
          .from("palmistry_readings")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.interpretation } : null;
      } else if (analysisType === "daily_horoscope") {
        const { data } = await supabase
          .from("daily_horoscopes")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data ? { ...data, result: data.horoscope_text } : null;
      } else {
        const { data } = await supabase
          .from("analysis_history")
          .select("*")
          .eq("id", analysisId)
          .maybeSingle();
        analysisData = data;
      }

      if (analysisData) {
        // Check if user has permission to view
        const canView = 
          analysisData.user_id === currentUserId || 
          (sharedData && (
            sharedData.is_public === true ||
            sharedData.shared_with_user_id === currentUserId ||
            sharedData.allowed_user_ids?.includes(currentUserId)
          ));
        
        if (!canView) {
          throw new Error("Bu analizi görüntüleme izniniz yok");
        }

        setSelectedAnalysis({
          ...analysisData,
          analysis_type: analysisType,
        });
        setAnalysisDialogOpen(true);
      } else {
        throw new Error("Analiz bulunamadı");
      }
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast({
        title: "Hata",
        description: error.message || "Analiz yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const startCall = async (type: "audio" | "video") => {
    if (!selectedFriend || !currentUserId) {
      console.error("Cannot start call: missing friend or user ID", { selectedFriend, currentUserId });
      return;
    }

    try {
      console.log("Starting call to:", selectedFriend.user_id, "Type:", type);
      
      // Create call log entry
      const { data: callLog, error } = await supabase
        .from("call_logs")
        .insert({
          caller_id: currentUserId,
          receiver_id: selectedFriend.user_id,
          call_type: type,
          status: "ringing",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating call log:", error);
        throw error;
      }

      console.log("Call log created successfully:", callLog);

      // Set active call
      setActiveCallId(callLog.call_id);
      setCallType(type);
      setShowCallInterface(true);

      // Show feedback to caller
      toast({
        title: "Arama Başlatıldı",
        description: `${selectedFriend.full_name || selectedFriend.username} aranıyor...`,
      });

      // Listen for call status updates (accepted, rejected)
      const callStatusChannel = supabase
        .channel(`call-status-${callLog.call_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_logs",
            filter: `call_id=eq.${callLog.call_id}`,
          },
          (payload) => {
            console.log("Caller: Call status updated", payload.new);
            if (payload.new.status === "accepted") {
              toast({
                title: "Arama Kabul Edildi",
                description: "Bağlanıyor...",
              });
            } else if (payload.new.status === "rejected") {
              toast({
                title: "Arama Reddedildi",
                variant: "destructive",
              });
              setShowCallInterface(false);
              setActiveCallId(null);
              supabase.removeChannel(callStatusChannel);
            } else if (payload.new.status === "ended") {
              setShowCallInterface(false);
              setActiveCallId(null);
              supabase.removeChannel(callStatusChannel);
            }
          }
        )
        .subscribe();

      console.log("Call initiated successfully. Call ID:", callLog.call_id);
    } catch (error: any) {
      console.error("Error starting call:", error);
      toast({
        title: "Arama Başlatılamadı",
        description: error.message || "Arama başlatılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Maksimum dosya boyutu 10MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    setAttachedFile(file);

    // Create preview for images and videos
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setAttachedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedFriend) return;

    if (selectedCategory === "other") {
      toast({
        title: "Mesaj Gönderilemez",
        description: "Bu kişiyle eşleşmeniz veya arkadaş olmanız gerekiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      soundEffects.playMessageSent();
      
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve) => {
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          const messageContent = `[VOICE_MESSAGE:${base64Audio}]`;
          let message_category: "friend" | "match" | "other" = selectedCategory || "other";

          const { error } = await supabase
            .from("messages")
            .insert({
              sender_id: currentUserId,
              receiver_id: selectedFriend.user_id,
              content: messageContent,
              message_category,
            });

          if (error) throw error;

          // Vibrate on successful send
          vibrateShort();

          setShowVoiceRecorder(false);
          loadMessages(selectedFriend.user_id);
          resolve(null);
        };
      });
    } catch (error: any) {
      soundEffects.playError();
      toast({
        title: "Hata",
        description: "Sesli mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", currentUserId);

      if (error) throw error;

      soundEffects.playClick();
      toast({
        title: "Başarılı",
        description: "Mesaj silindi",
      });

      if (selectedFriend) {
        loadMessages(selectedFriend.user_id);
      }
    } catch (error: any) {
      soundEffects.playError();
      toast({
        title: "Hata",
        description: "Mesaj silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const handleTranslateMessage = async (messageId: string, text: string) => {
    if (translatedMessages[messageId]) {
      // Already translated, remove translation to show original
      setTranslatedMessages(prev => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
      return;
    }

    setTranslatingMessageId(messageId);
    try {
      // Get user's preferred language
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('user_id', user.id)
        .maybeSingle();

      const preferredLanguage = profile?.preferred_language || 'tr';

      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: { 
          text, 
          targetLanguage: preferredLanguage,
          detectLanguage: true 
        }
      });

      if (error) throw error;

      if (data?.translatedText && data?.needsTranslation) {
        setTranslatedMessages(prev => ({
          ...prev,
          [messageId]: {
            text: data.translatedText,
            sourceLanguage: data.detectedLanguage
          }
        }));
        // Show translation by default when manually triggered
        setShowTranslation(prev => ({
          ...prev,
          [messageId]: true
        }));
      } else if (!data?.needsTranslation) {
        toast({
          title: "Çeviri Gereksiz",
          description: "Mesaj zaten tercih ettiğiniz dilde",
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Çeviri Hatası",
        description: "Mesaj çevrilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setTranslatingMessageId(null);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!selectedFriend) return;

    if (selectedCategory === "other") {
      toast({
        title: "Mesaj Gönderilemez",
        description: "Bu kişiyle eşleşmeniz veya arkadaş olmanız gerekiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      soundEffects.playMessageSent();
      const messageContent = `[GIF:${gifUrl}]`;
      let message_category: "friend" | "match" | "other" = selectedCategory || "other";

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedFriend.user_id,
          content: messageContent,
          message_category,
        });

      if (error) throw error;

      // Vibrate on successful send
      vibrateShort();

      setShowGifPicker(false);
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "GIF gönderilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const isPinned = !!message?.pinned_at;

      const { error } = await supabase
        .from("messages")
        .update({ pinned_at: isPinned ? null : new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;

      loadMessages(selectedFriend!.user_id);
      toast({
        title: isPinned ? "Sabitleme kaldırıldı" : "Mesaj sabitlendi",
        description: isPinned ? "Mesaj artık sabitli değil" : "Mesaj konuşmanın başına sabitlendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleForwardMessage = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // For now, just copy the message content to input
      setNewMessage(message.content.replace(/\[.*?\]/g, ''));
      toast({
        title: "Mesaj kopyalandı",
        description: "Mesaj içeriği giriş alanına kopyalandı. İstediğiniz kişiye gönderebilirsiniz.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj iletilemedi.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachedFile) || !selectedFriend) return;

    // Check if this is an "other" category conversation - they can't reply
    if (selectedCategory === "other") {
      toast({
        title: "Mesaj Gönderilemez",
        description: "Bu kişiyle eşleşmeniz veya arkadaş olmanız gerekiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      soundEffects.playMessageSent();
      let messageContent = newMessage.trim();

      // If there's an attached file, add it to the message
      if (attachedFile) {
        const fileType = attachedFile.type.startsWith("image/") 
          ? "🖼️ Resim" 
          : attachedFile.type.startsWith("video/") 
          ? "🎥 Video" 
          : "📎 Dosya";
        
        messageContent = `${fileType}: ${attachedFile.name}\n${messageContent}`;
        
        if (attachedFilePreview) {
          messageContent += `\n[FILE_PREVIEW:${attachedFilePreview}]`;
        }
      }

      // Determine message category
      let message_category: "friend" | "match" | "other" = selectedCategory || "other";

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedFriend.user_id,
          content: messageContent,
          message_category,
          reply_to: replyingTo?.id || null,
        });

      if (error) throw error;

      // Vibrate on successful send
      vibrateShort();

      // Stop typing indicator
      if (typingChannelRef.current) {
        typingChannelRef.current.track({
          user_id: currentUserId,
          typing: false,
        });
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Clear draft after successful send
      draft.clearDraft();

      setNewMessage("");
      setReplyingTo(null);
      removeAttachment();
      
      // Reset textarea height
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const searchInMessages = async (query: string) => {
    if (!query.trim() || !currentUserId) {
      setMessageSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search in direct messages
      const { data: directMessages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      // Search in group messages
      const { data: groupMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", currentUserId);

      const groupIds = groupMemberships?.map(m => m.group_id) || [];
      
      let groupMessages: any[] = [];
      if (groupIds.length > 0) {
        const { data } = await supabase
          .from("group_messages")
          .select("*")
          .in("group_id", groupIds)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(50);
        
        groupMessages = data || [];
      }

      // Get user profiles for direct messages
      const userIds = new Set<string>();
      (directMessages || []).forEach(msg => {
        if (msg.sender_id !== currentUserId) userIds.add(msg.sender_id);
        if (msg.receiver_id !== currentUserId) userIds.add(msg.receiver_id);
      });

      let profiles: any[] = [];
      if (userIds.size > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, profile_photo, is_online, last_seen")
          .in("user_id", Array.from(userIds));
        
        profiles = data || [];
      }

      // Get group info
      let groups: any[] = [];
      if (groupIds.length > 0) {
        const { data } = await supabase
          .from("groups")
          .select("id, name, description, photo_url")
          .in("id", groupIds);
        
        groups = data || [];
      }

      // Build search results for direct messages
      const directResults: MessageSearchResult[] = (directMessages || []).map(msg => {
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        const profile = profiles.find(p => p.user_id === otherUserId);
        
        return {
          message: {
            ...msg,
            message_category: (msg.message_category || "other") as "friend" | "match" | "other"
          },
          conversationId: otherUserId,
          conversationType: 'direct' as const,
          friend: profile ? {
            user_id: profile.user_id,
            username: profile.username,
            full_name: profile.full_name,
            profile_photo: profile.profile_photo,
            is_online: profile.is_online,
            last_seen: profile.last_seen,
          } : undefined,
        };
      });

      // Build search results for group messages
      const groupResults: MessageSearchResult[] = groupMessages.map(msg => {
        const group = groups.find(g => g.id === msg.group_id);
        
        return {
          message: msg as any,
          conversationId: msg.group_id,
          conversationType: 'group' as const,
          group: group ? {
            id: group.id,
            name: group.name,
            description: group.description,
            photo_url: group.photo_url,
          } : undefined,
        };
      });

      // Combine and sort by date
      const allResults = [...directResults, ...groupResults].sort((a, b) => 
        b.message.created_at.localeCompare(a.message.created_at)
      );

      setMessageSearchResults(allResults);
    } catch (error: any) {
      console.error("Error searching messages:", error);
      toast({
        title: "Hata",
        description: "Arama sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const doSearch = async () => {
      if (searchMode === "messages" && searchQuery.trim() && currentUserId) {
        await searchInMessages(searchQuery);
      } else {
        setMessageSearchResults([]);
      }
    };

    const timer = setTimeout(() => {
      doSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, currentUserId]);

  const handlePinConversation = async (conv: Conversation) => {
    try {
      if (conv.isPinned) {
        await supabase
          .from("conversation_pins")
          .delete()
          .eq("user_id", currentUserId)
          .eq("conversation_type", conv.type)
          .eq("conversation_id", conv.id);
        
        toast({ title: "Sabitleme kaldırıldı" });
      } else {
        await supabase
          .from("conversation_pins")
          .insert({
            user_id: currentUserId,
            conversation_type: conv.type,
            conversation_id: conv.id,
          });
        
        toast({ title: "Konuşma sabitlendi" });
      }
      
      loadConversations();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi.",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    if (conv.type === 'direct' && conv.friend) {
      return conv.friend.username.toLowerCase().includes(searchLower) ||
             conv.friend.full_name?.toLowerCase().includes(searchLower);
    } else if (conv.type === 'group' && conv.group) {
      return conv.group.name.toLowerCase().includes(searchLower);
    }
    return false;
  });

  const friendConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "friend");
  const matchConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "match");
  const otherConversations = filteredConversations.filter(c => c.type === 'direct' && c.category === "other");
  const groupConversations = filteredConversations.filter(c => c.type === 'group');

  const friendUnreadCount = friendConversations.filter(c => c.unreadCount > 0).length;
  const matchUnreadCount = matchConversations.filter(c => c.unreadCount > 0).length;
  const otherUnreadCount = otherConversations.filter(c => c.unreadCount > 0).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
            Mesajlar
          </h1>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 p-4">
              <SkeletonConversationList count={8} />
            </Card>
            <Card className="md:col-span-2 p-4">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Yükleniyor...</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Conversation Item Component
  const ConversationItem = ({ conv, selected, onClick }: any) => {
    const isGroup = conv.type === 'group';
    const displayName = isGroup ? conv.group?.name : (conv.friend?.full_name || conv.friend?.username);
    const displayPhoto = isGroup ? conv.group?.photo_url : conv.friend?.profile_photo;
    const displayUsername = isGroup ? `${conv.group?.member_count || 0} üye` : `@${conv.friend?.username}`;
    
    const lastMessageText = isGroup 
      ? (conv.lastMessage ? `${conv.lastMessageSenderName}: ${conv.lastMessage.content}` : "Henüz mesaj yok")
      : (conv.lastMessage?.content || "");
    
    const lastMessageTime = conv.lastMessage?.created_at 
      ? formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true, locale: tr })
      : "";

    return (
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 relative ${
          selected ? "bg-accent" : ""
        }`}
        onClick={onClick}
      >
        {conv.isPinned && (
          <Pin className="absolute top-2 right-2 w-3 h-3 text-primary" />
        )}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={displayPhoto || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {isGroup ? <Users className="w-6 h-6" /> : displayName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isGroup && conv.friend?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-medium truncate">{displayName}</p>
              <span className="text-xs text-muted-foreground">{lastMessageTime}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{displayUsername}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {lastMessageText.substring(0, 50)}
              </p>
              {conv.unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs ml-2">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Message Search Result Item Component
  const MessageSearchResultItem = ({ result }: { result: MessageSearchResult }) => {
    const isGroup = result.conversationType === 'group';
    const displayName = isGroup 
      ? result.group?.name 
      : (result.friend?.full_name || result.friend?.username);
    const displayPhoto = isGroup ? result.group?.photo_url : result.friend?.profile_photo;
    
    const messageTime = formatDistanceToNow(new Date(result.message.created_at), { 
      addSuffix: true, 
      locale: tr 
    });

    const handleClick = () => {
      if (isGroup) {
        navigate(`/groups/${result.conversationId}`);
      } else if (result.friend) {
        setSelectedFriend(result.friend);
        setSelectedCategory(result.message.message_category);
        loadMessages(result.friend.user_id);
        setSearchMode("conversations");
        setSearchQuery("");
      }
    };

    // Highlight search query in message content
    const highlightText = (text: string) => {
      if (!searchQuery) return text;
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() 
          ? <mark key={i} className="bg-primary/20">{part}</mark>
          : part
      );
    };

    return (
      <div
        className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={displayPhoto || undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
              {isGroup ? <Users className="w-5 h-5" /> : displayName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <span className="text-xs text-muted-foreground">{messageTime}</span>
            </div>
            <p className="text-sm text-foreground/80 line-clamp-2">
              {highlightText(result.message.content)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container-mobile bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Mesajlar
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className={`md:col-span-1 p-4 ${isMobile && selectedFriend ? 'hidden' : ''}`}>
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchMode === "conversations" ? "Konuşmalarda ara..." : "Mesajlarda ara..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={searchMode === "conversations" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchMode("conversations")}
                  className="flex-1 text-xs"
                >
                  Konuşmalar
                </Button>
                <Button
                  variant={searchMode === "messages" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchMode("messages")}
                  className="flex-1 text-xs"
                >
                  Mesajlar
                </Button>
              </div>
            </div>

            {/* Message Search Results */}
            {searchMode === "messages" && searchQuery && (
              <ScrollArea className="h-[calc(100vh-380px)]">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messageSearchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      "{searchQuery}" için sonuç bulunamadı
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground px-1 mb-2">
                      {messageSearchResults.length} mesaj bulundu
                    </p>
                    {messageSearchResults.map((result, idx) => (
                      <MessageSearchResultItem key={idx} result={result} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Conversation Tabs */}
            {searchMode === "conversations" && (
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="friends" className="text-xs">
                    Arkadaş
                    {friendUnreadCount > 0 && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                        {friendUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="matches" className="text-xs">
                    Eşleşme
                    {matchUnreadCount > 0 && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                        {matchUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="text-xs">
                    Gruplar
                  </TabsTrigger>
                  <TabsTrigger value="other" className="text-xs">
                    Diğer
                    {otherUnreadCount > 0 && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                        {otherUnreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-2">
                      {friendConversations.length === 0 ? (
                        <div className="py-8 px-4">
                          <EmptyState
                            icon={UserPlus}
                            title="Mesaj yok"
                            description="Henüz arkadaşlarınızdan mesaj almadınız. Yeni arkadaşlar bulun ve sohbete başlayın!"
                            actionLabel="Arkadaş Bul"
                            onAction={() => navigate("/discovery")}
                            illustration={<NoMessagesIllustration />}
                            variant="gradient"
                          />
                        </div>
                      ) : (
                        friendConversations.map((conv) => (
                          <div key={conv.id} className="relative group">
                            <ConversationItem
                              conv={conv}
                              selected={selectedFriend?.user_id === conv.id}
                              onClick={() => {
                                setSelectedFriend(conv.friend!);
                                setSelectedCategory(conv.category!);
                                loadMessages(conv.friend!.user_id);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinConversation(conv);
                              }}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="matches" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-2">
                      {matchConversations.length === 0 ? (
                        <div className="py-8 px-4">
                          <EmptyState
                            icon={Heart}
                            title="Eşleşme yok"
                            description="Henüz eşleşmenizden mesaj almadınız. Match bölümünden yeni insanlarla eşleşin!"
                            actionLabel="Eşleşmeleri Gör"
                            onAction={() => navigate("/match")}
                          />
                        </div>
                      ) : (
                        matchConversations.map((conv) => (
                          <div key={conv.id} className="relative group">
                            <ConversationItem
                              conv={conv}
                              selected={selectedFriend?.user_id === conv.id}
                              onClick={() => {
                                setSelectedFriend(conv.friend!);
                                setSelectedCategory(conv.category!);
                                loadMessages(conv.friend!.user_id);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinConversation(conv);
                              }}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="groups" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-2">
                      {groupConversations.length === 0 ? (
                        <div className="py-8 px-4">
                          <EmptyState
                            icon={Users}
                            title="Grup yok"
                            description="Henüz hiçbir gruba üye değilsiniz. Grup oluşturun veya gruplara katılın!"
                            actionLabel="Gruplara Git"
                            onAction={() => navigate("/groups")}
                          />
                        </div>
                      ) : (
                        groupConversations.map((conv) => (
                          <div key={conv.id} className="relative group">
                            <ConversationItem
                              conv={conv}
                              selected={false}
                              onClick={() => navigate(`/groups/${conv.id}`)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinConversation(conv);
                              }}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="other" className="mt-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="space-y-2">
                      {otherConversations.length === 0 ? (
                        <div className="py-8 px-4">
                          <EmptyState
                            icon={MessageSquare}
                            title="Mesaj yok"
                            description="Henüz diğer mesajlarınız yok."
                          />
                        </div>
                      ) : (
                        otherConversations.map((conv) => (
                          <div key={conv.id} className="relative group">
                            <ConversationItem
                              conv={conv}
                              selected={selectedFriend?.user_id === conv.id}
                              onClick={() => {
                                setSelectedFriend(conv.friend!);
                                setSelectedCategory(conv.category!);
                                loadMessages(conv.friend!.user_id);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinConversation(conv);
                              }}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </Card>

          {/* Messages Panel */}
          <Card className={`md:col-span-2 flex flex-col ${isMobile && !selectedFriend ? 'hidden' : ''}`}>
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFriend(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="relative">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => {
                        if (selectedCategory === "other") {
                          navigate(`/match?userId=${selectedFriend.user_id}`);
                        } else {
                          navigate(`/profile/${selectedFriend.username}`);
                        }
                      }}
                    >
                      <AvatarImage src={selectedFriend.profile_photo} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {selectedFriend.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedFriend.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></span>
                    )}
                  </div>
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
                    onClick={() => {
                      if (selectedCategory === "other") {
                        navigate(`/match?userId=${selectedFriend.user_id}`);
                      } else {
                        navigate(`/profile/${selectedFriend.username}`);
                      }
                    }}
                  >
                    <p className="font-medium">
                      {selectedFriend.full_name || selectedFriend.username}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">@{selectedFriend.username}</p>
                      {selectedFriend.is_online ? (
                        <span className="text-xs text-green-500">• Çevrimiçi</span>
                      ) : selectedFriend.last_seen && (
                        <span className="text-xs text-muted-foreground">
                          • {(() => {
                            const diff = Date.now() - new Date(selectedFriend.last_seen).getTime();
                            const minutes = Math.floor(diff / 60000);
                            const hours = Math.floor(minutes / 60);
                            const days = Math.floor(hours / 24);
                            if (days > 0) return `${days} gün önce`;
                            if (hours > 0) return `${hours} saat önce`;
                            if (minutes > 0) return `${minutes} dk önce`;
                            return 'Az önce';
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedCategory !== "other" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startCall("audio")}
                          title="Sesli Arama"
                        >
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startCall("video")}
                          title="Görüntülü Arama"
                        >
                          <Video className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {selectedCategory === "other" && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      <span>Cevap verilemez</span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Pinned Messages */}
                    {pinnedMessages.length > 0 && (
                      <div className="bg-accent/20 rounded-lg p-3 border-l-4 border-primary">
                        <div className="flex items-center gap-2 mb-2">
                          <Pin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Sabitlenmiş Mesajlar</span>
                        </div>
                        <div className="space-y-2">
                          {pinnedMessages.slice(0, 3).map(pm => (
                            <p key={pm.id} className="text-xs text-muted-foreground truncate">
                              {pm.content.replace(/\[.*?\]/g, '').substring(0, 50)}...
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg) => {
                      const isAnalysisShare = msg.analysis_id;
                      const isVoiceMessage = msg.content.includes("[VOICE_MESSAGE:");
                      const isGif = msg.content.includes("[GIF:");
                      const hasFilePreview = msg.content.includes("[FILE_PREVIEW:");
                      let displayContent = msg.content;
                      let filePreview = null;
                      let voiceMessageUrl = null;
                      let gifUrl = null;

                      if (isGif) {
                        const gifMatch = msg.content.match(/\[GIF:([^\]]+)\]/);
                        if (gifMatch) {
                          gifUrl = gifMatch[1];
                        }
                      }

                      if (isVoiceMessage) {
                        const voiceMatch = msg.content.match(/\[VOICE_MESSAGE:([^\]]+)\]/);
                        if (voiceMatch) {
                          voiceMessageUrl = voiceMatch[1];
                        }
                      }

                      if (hasFilePreview) {
                        const previewMatch = msg.content.match(/\[FILE_PREVIEW:([^\]]+)\]/);
                        if (previewMatch) {
                          filePreview = previewMatch[1];
                          displayContent = msg.content.replace(/\[FILE_PREVIEW:[^\]]+\]/, "").trim();
                        }
                      }
                      
                      return (
                        <SwipeableMessage
                          key={msg.id}
                          onSwipeRight={() => handleReplyToMessage(msg)}
                          onSwipeLeft={msg.sender_id === currentUserId ? () => handleDeleteMessage(msg.id) : undefined}
                        >
                           <div
                            className={`flex gap-2 group ${
                              msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                            }`}
                          >
                           <div className="flex flex-col max-w-[85%] min-w-0">
                            {msg.pinned_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Pin className="w-3 h-3" />
                                <span>Sabitlendi</span>
                              </div>
                            )}
                            
                            {/* Replied Message Preview */}
                            {msg.replied_message && (
                              <div className={`text-xs p-2 rounded-t-lg border-l-2 ${
                                msg.sender_id === currentUserId 
                                  ? "bg-primary/5 border-primary-foreground/30" 
                                  : "bg-muted/50 border-primary/30"
                              }`}>
                                <div className="font-semibold opacity-70 mb-1">
                                  {msg.replied_message.sender_id === currentUserId ? "Sen" : selectedFriend?.full_name || selectedFriend?.username}
                                </div>
                                <div className="opacity-60 truncate">
                                  {msg.replied_message.content.replace(/\[.*?\]/g, '').substring(0, 50)}
                                  {msg.replied_message.content.length > 50 && '...'}
                                </div>
                              </div>
                            )}
                            
                            {isAnalysisShare ? (
                              <AnalysisMessageCard
                                content={msg.content}
                                analysisType={msg.analysis_type}
                                timestamp={msg.created_at}
                                isSender={msg.sender_id === currentUserId}
                                messageId={msg.id}
                                currentUserId={currentUserId}
                                onClick={() => {
                                  if (msg.analysis_type) {
                                    handleAnalysisClick(msg.analysis_id!, msg.analysis_type);
                                  } else {
                                    toast({
                                      title: "Hata",
                                      description: "Analiz türü bilgisi bulunamadı.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              />
                            ) : isGif && gifUrl ? (
                              <>
                                <div className="rounded-lg overflow-hidden max-w-xs">
                                  <img
                                    src={gifUrl}
                                    alt="GIF"
                                    className="w-full h-auto"
                                  />
                                  <div className={`px-2 py-1 text-xs opacity-70 flex items-center gap-2 ${
                                    msg.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}>
                                    <span>
                                      {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {msg.sender_id === currentUserId && (
                                      <span title={msg.read ? "Okundu" : "İletildi"}>
                                        {msg.read ? (
                                          <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                        ) : (
                                          <Check className="w-3 h-3 inline" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <MessageReactions
                                  messageId={msg.id}
                                  currentUserId={currentUserId}
                                />
                              </>
                            ) : isVoiceMessage && voiceMessageUrl ? (
                            <>
                              <div className={`rounded-lg overflow-hidden ${
                                msg.sender_id === currentUserId
                                  ? "bg-primary/10"
                                  : "bg-muted"
                              }`}>
                                <div className="p-2">
                                  <VoiceMessagePlayer audioUrl={voiceMessageUrl} />
                                  <div className="flex items-center gap-2 justify-end mt-1">
                                    <p className="text-xs opacity-70">
                                      {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                    {msg.sender_id === currentUserId && (
                                      <span className="text-xs opacity-70" title={msg.read ? "Okundu" : "İletildi"}>
                                        {msg.read ? (
                                          <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                        ) : (
                                          <Check className="w-3 h-3 inline" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <MessageReactions
                                messageId={msg.id}
                                currentUserId={currentUserId}
                              />
                            </>
                          ) : (
                            <div
                              className={`max-w-full rounded-lg overflow-hidden ${
                                translatedMessages[msg.id]
                                  ? msg.sender_id === currentUserId
                                    ? "bg-primary text-primary-foreground ring-2 ring-accent/50 shadow-lg"
                                    : "bg-gradient-to-br from-accent/20 to-muted ring-2 ring-accent/30 shadow-lg"
                                  : msg.sender_id === currentUserId
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {filePreview && (
                                <div className="relative">
                                  {displayContent.startsWith("🖼️ Resim") ? (
                                    <img 
                                      src={filePreview} 
                                      alt="Shared" 
                                      className="w-full max-h-64 object-cover"
                                    />
                                  ) : displayContent.startsWith("🎥 Video") ? (
                                    <video 
                                      src={filePreview} 
                                      controls 
                                      className="w-full max-h-64"
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div className="px-4 py-2">
                                <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
                                {translatedMessages[msg.id] && (
                                  <div className="mt-2 pt-2 border-t border-current/20 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                        <p className="text-xs opacity-70 font-medium">
                                          {translatedMessages[msg.id].sourceLanguage 
                                            ? `${languageNames[translatedMessages[msg.id].sourceLanguage!] || translatedMessages[msg.id].sourceLanguage} → Türkçe`
                                            : 'Otomatik Çeviri'
                                          }
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowTranslation(prev => ({
                                          ...prev,
                                          [msg.id]: !prev[msg.id]
                                        }))}
                                        className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                                      >
                                        {showTranslation[msg.id] === false ? (
                                          <>
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                            </svg>
                                            Çeviriyi Göster
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Orijinali Göster
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    {showTranslation[msg.id] !== false && (
                                      <p className="text-sm whitespace-pre-wrap break-words font-medium">
                                        {translatedMessages[msg.id].text}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs opacity-70">
                                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  {msg.sender_id === currentUserId && (
                                    <span className="text-xs opacity-70" title={msg.read ? "Okundu" : "İletildi"}>
                                      {msg.read ? (
                                        <CheckCheck className="w-3 h-3 text-blue-400 inline" />
                                      ) : (
                                        <Check className="w-3 h-3 inline" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                            {!isAnalysisShare && (
                              <MessageReactions
                                messageId={msg.id}
                                currentUserId={currentUserId}
                              />
                            )}
                          </div>

                          {/* Message Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleReplyToMessage(msg)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Yanıtla
                              </DropdownMenuItem>
                              {!isAnalysisShare && !isVoiceMessage && !isGif && (
                                <DropdownMenuItem 
                                  onClick={() => handleTranslateMessage(msg.id, displayContent)}
                                  disabled={translatingMessageId === msg.id}
                                >
                                  {translatingMessageId === msg.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileText className="mr-2 h-4 w-4" />
                                  )}
                                  {translatedMessages[msg.id] ? "Orijinali Göster" : "Çevir"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handlePinMessage(msg.id)}>
                                <Pin className="mr-2 h-4 w-4" />
                                {msg.pinned_at ? "Sabitlemeyi Kaldır" : "Sabitle"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleForwardMessage(msg.id)}>
                                <Forward className="mr-2 h-4 w-4" />
                                İlet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
                        </SwipeableMessage>
                      );
                    })}

                    {/* Typing Indicator */}
                    {isOtherUserTyping && (
                      <div className="flex gap-2 justify-start">
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {selectedCategory === "other" ? (
                  <div className="p-4 border-t bg-muted/50">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
                      <Ban className="w-4 h-4" />
                      <p>Bu kişiyle mesajlaşmak için eşleşmeniz veya arkadaş olmanız gerekiyor</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t space-y-3">
                    {/* Reply Preview */}
                    {replyingTo && (
                      <div className="flex items-start gap-2 p-3 bg-primary/5 border-l-2 border-primary rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-primary mb-1">
                            {replyingTo.sender_id === currentUserId ? "Kendine" : selectedFriend?.full_name || selectedFriend?.username}'ye yanıt veriyorsun
                          </div>
                          <div className="text-sm opacity-70 truncate">
                            {replyingTo.content.replace(/\[.*?\]/g, '').substring(0, 60)}
                            {replyingTo.content.length > 60 && '...'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                          className="h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                    
                    {/* Voice Recorder */}
                    {showVoiceRecorder ? (
                      <VoiceRecorder
                        onSend={handleSendVoiceMessage}
                        onCancel={() => setShowVoiceRecorder(false)}
                      />
                    ) : (
                      <>
                        {/* File Preview */}
                        {attachedFile && (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeAttachment}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex gap-1 md:gap-2 items-center">
                          {/* Draft indicator - Hidden on mobile */}
                          {draft.hasDraft && draft.lastSaved && (
                            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mr-2">
                              <Save className="w-3 h-3" />
                              <span>
                                {new Date(draft.lastSaved).toLocaleTimeString('tr-TR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          )}
                          
                          {/* Emoji Picker */}
                          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" type="button" className="h-8 w-8 md:h-10 md:w-10">
                                <Smile className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 border-0" align="start">
                              <EmojiPicker onEmojiClick={onEmojiClick} />
                            </PopoverContent>
                          </Popover>

                          {/* File Attachment */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 w-8 md:h-10 md:w-10"
                          >
                            <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                          </Button>

                          {/* Message Input */}
                          <Textarea
                            ref={messageInputRef}
                            placeholder="Mesajınızı yazın..."
                            value={newMessage}
                            onChange={handleTextareaChange}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="flex-1 min-w-0 min-h-[40px] max-h-[120px] resize-none"
                            rows={1}
                            {...longPressHandlers}
                          />
                          
                          {/* Additional Options - Hidden on mobile, visible on desktop */}
                          <div className="hidden md:flex gap-2">
                            {/* Voice Recorder Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => setShowVoiceRecorder(true)}
                            >
                              <Mic className="w-5 h-5" />
                            </Button>

                            {/* GIF Picker */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              type="button"
                              onClick={() => setShowGifPicker(true)}
                            >
                              <ImageIcon className="w-5 h-5" />
                            </Button>
                            
                            {/* Schedule Button */}
                            {selectedCategory === "friend" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setScheduleDialogOpen(true)}
                                title="Mesaj Zamanla"
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Send Button */}
                          <Button
                            onClick={handleSendMessage}
                            disabled={(!newMessage.trim() && !attachedFile) || isSending}
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10 shrink-0"
                          >
                            {isSending ? (
                              <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <EmptyState
                  icon={MessageSquare}
                  title="Bir konuşma seçin"
                  description="Mesajlaşmaya başlamak için sol taraftan bir kişi veya grup seçin. Yeni arkadaşlar edinmek için keşfet bölümünü ziyaret edebilirsiniz."
                  actionLabel="Arkadaş Bul"
                  onAction={() => navigate("/discovery")}
                  illustration={<NoConversationIllustration />}
                  variant="gradient"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Analysis Detail Dialog */}
        <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analiz Detayları</DialogTitle>
              <DialogDescription>
                Paylaşılan analiz sonuçlarını inceleyebilirsiniz
              </DialogDescription>
            </DialogHeader>
            {selectedAnalysis && (
              <AnalysisDetailView
                result={selectedAnalysis.result}
                analysisType={selectedAnalysis.analysis_type}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Video Call Dialog */}
        {showCallInterface && selectedFriend && activeCallId && (
          <VideoCallDialog
            isOpen={showCallInterface}
            onClose={() => {
              setShowCallInterface(false);
              setActiveCallId(null);
            }}
            callId={activeCallId}
            friendId={selectedFriend.user_id}
            friendName={selectedFriend.full_name || selectedFriend.username}
            friendPhoto={selectedFriend.profile_photo}
            callType={callType}
          />
        )}

        {/* Schedule Message Dialog */}
        {selectedFriend && (
          <ScheduleMessageDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            receiverId={selectedFriend.user_id}
            receiverName={selectedFriend.full_name || selectedFriend.username}
          />
        )}

        {/* GIF Picker Dialog */}
        <GifPicker
          open={showGifPicker}
          onOpenChange={setShowGifPicker}
          onSelectGif={handleSendGif}
        />

        {/* Incoming/Active Call Dialog */}
        {incomingCall && (
          <VideoCallDialog
            isOpen={true}
            onClose={() => {
              setIncomingCall(null);
              if (ringtone) {
                ringtone.stop();
                setRingtone(null);
              }
            }}
            callId={incomingCall.callId}
            friendId={incomingCall.callerId}
            friendName={incomingCall.callerName}
            friendPhoto={incomingCall.callerPhoto}
            isIncoming={true}
            callType={incomingCall.callType}
          />
        )}

        {/* Mobile Options Menu */}
        <Drawer open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Mesaj Seçenekleri</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => {
                  setShowVoiceRecorder(true);
                  setShowMobileMenu(false);
                }}
              >
                <Mic className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Sesli Mesaj</div>
                  <div className="text-xs text-muted-foreground">Ses kaydı gönder</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => {
                  setShowGifPicker(true);
                  setShowMobileMenu(false);
                }}
              >
                <ImageIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">GIF Gönder</div>
                  <div className="text-xs text-muted-foreground">Animasyonlu resim paylaş</div>
                </div>
              </Button>

              {selectedCategory === "friend" && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => {
                    setScheduleDialogOpen(true);
                    setShowMobileMenu(false);
                  }}
                >
                  <Clock className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Mesaj Zamanla</div>
                    <div className="text-xs text-muted-foreground">İleri bir tarihte gönder</div>
                  </div>
                </Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
};

export default Messages;
