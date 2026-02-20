import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/hooks/use-draft";
import { Loader2, Send, Search, ArrowLeft, FileText, Smile, Paperclip, Ban, Check, CheckCheck, Mic, Image as ImageIcon, Pin, Forward, MoreVertical, Users, Phone, Video, Clock, MessageSquare, UserPlus, Heart, Save, ShieldMinus } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
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
import { uploadToStorage } from "@/utils/storageUpload";
import { VideoCallDialog } from "@/components/VideoCallDialog";
import { ScheduleMessageDialog } from "@/components/ScheduleMessageDialog";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { playRingtone, vibrate, showBrowserNotification } from "@/utils/callNotifications";
import { requestNotificationPermission, subscribeToPushNotifications, checkNotificationPermission } from "@/utils/pushNotifications";
import { SkeletonConversationList } from "@/components/SkeletonConversation";
import { EmptyState } from "@/components/ui/empty-state";
import { NoMessagesIllustration } from "@/components/EmptyStateIllustrations";
import { TemporaryProfileDialog } from "@/components/TemporaryProfileDialog";
import { SharedAnalysisCard } from "@/components/SharedAnalysisCard";

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

  // Temporary Profile State
  const [tempProfileOpen, setTempProfileOpen] = useState(false);
  const [tempProfileData, setTempProfileData] = useState<any>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isRemovingMatch, setIsRemovingMatch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
          .single();

        if (call) {
          // Load caller profile
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo')
            .eq('user_id', call.caller_id)
            .single();

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
          .order('started_at', { ascending: false })
          .limit(1);

        if (pendingCalls && pendingCalls.length > 0) {
          const call = pendingCalls[0];

          // Load caller profile
          const { data: callerProfile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo')
            .eq('user_id', call.caller_id)
            .single();

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
        () => {
          if (selectedFriend) {
            loadMessages(selectedFriend.user_id);
          }
          loadConversations();
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
              .single();

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
              .single();

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

      const parsedMessages = data?.map(msg => {
        const analysisIdMatch = msg.content.match(/\[Analiz ID: ([^\]]+)\]/);
        const analysisTypeMatch = msg.content.match(/\[Analiz Türü: ([^\]]+)\]/);
        if (analysisIdMatch && analysisTypeMatch) {
          return {
            ...msg,
            message_category: (msg.message_category || "other") as "friend" | "match" | "other",
            analysis_id: analysisIdMatch[1],
            analysis_type: analysisTypeMatch[1],
          };
        }
        return {
          ...msg,
          message_category: (msg.message_category || "other") as "friend" | "match" | "other",
        };
      }) || [];

      setMessages(parsedMessages);

      const pinnedMsgs = parsedMessages.filter(m => m.pinned_at);
      setPinnedMessages(pinnedMsgs);

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
          throw new Error("Bu analizi gÃ¶rÃ¼ntÃ¼leme izniniz yok");
        }

        setSelectedAnalysis({
          ...analysisData,
          analysis_type: analysisType,
        });
        setAnalysisDialogOpen(true);
      } else {
        throw new Error("Analiz bulunamadÄ±");
      }
    } catch (error: any) {
      console.error("Error loading analysis:", error);
      toast({
        title: "Hata",
        description: error.message || "Analiz yÃ¼klenemedi.",
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
        title: "Arama BaÅŸlatÄ±ldÄ±",
        description: `${selectedFriend.full_name || selectedFriend.username} aranÄ±yor...`,
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
                description: "BaÄŸlanÄ±yor...",
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
        title: "Arama BaÅŸlatÄ±lamadÄ±",
        description: error.message || "Arama baÅŸlatÄ±lÄ±rken bir hata oluÅŸtu.",
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
        title: "Dosya Ã§ok bÃ¼yÃ¼k",
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
        title: "Mesaj GÃ¶nderilemez",
        description: "Bu kiÅŸiyle eÅŸleÅŸmeniz veya arkadaÅŸ olmanÄ±z gerekiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      soundEffects.playMessageSent();

      // Upload audio to Storage
      // Convert Blob to File
      const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
      const publicUrl = await uploadToStorage(audioFile, "messages", currentUserId);

      if (!publicUrl) throw new Error("Ses dosyası yüklenemedi");

      const messageContent = `[VOICE_MESSAGE:${publicUrl}]`;
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

      setShowVoiceRecorder(false);
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      soundEffects.playError();
      toast({
        title: "Hata",
        description: "Sesli mesaj gÃ¶nderilemedi",
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
        title: "BaÅŸarÄ±lÄ±",
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

  const handleReplyToMessage = (messageContent: string) => {
    setNewMessage(`YanÄ±t: "${messageContent.substring(0, 50)}..." \n\n`);
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!selectedFriend) return;

    if (selectedCategory === "other") {
      toast({
        title: "Mesaj GÃ¶nderilemez",
        description: "Bu kiÅŸiyle eÅŸleÅŸmeniz veya arkadaÅŸ olmanÄ±z gerekiyor.",
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
          // Add metadata for better handling if schema supports
        });

      if (error) throw error;

      setShowGifPicker(false);
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "GIF gÃ¶nderilemedi.",
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
        title: isPinned ? "Sabitleme kaldÄ±rÄ±ldÄ±" : "Mesaj sabitlendi",
        description: isPinned ? "Mesaj artÄ±k sabitli deÄŸil" : "Mesaj konuÅŸmanÄ±n baÅŸÄ±na sabitlendi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Ä°ÅŸlem gerÃ§ekleÅŸtirilemedi.",
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
        title: "Mesaj kopyalandÄ±",
        description: "Mesaj iÃ§eriÄŸi giriÅŸ alanÄ±na kopyalandÄ±. Ä°stediÄŸiniz kiÅŸiye gÃ¶nderebilirsiniz.",
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
        title: "Mesaj GÃ¶nderilemez",
        description: "Bu kiÅŸiyle eÅŸleÅŸmeniz veya arkadaÅŸ olmanÄ±z gerekiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      soundEffects.playMessageSent();
      let messageContent = newMessage.trim();

      // If there's an attached file, upload it and add to message
      if (attachedFile) {
        const publicUrl = await uploadToStorage(attachedFile, "messages", currentUserId);
        if (!publicUrl) throw new Error("Dosya yüklenemedi");

        const fileType = attachedFile.type.startsWith("image/")
          ? "ğŸ–¼ï¸  Resim"
          : attachedFile.type.startsWith("video/")
            ? "ğŸŽ¥ Video"
            : "ğŸ“Ž Dosya";

        messageContent = `${fileType}: ${attachedFile.name}\n${messageContent}`;

        // Instead of massive base64, save the Storage URL as the preview format
        messageContent += `\n[FILE_PREVIEW:${publicUrl}]`;
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
        });

      if (error) throw error;

      // Clear draft after successful send
      draft.clearDraft();

      setNewMessage("");
      removeAttachment();
      loadMessages(selectedFriend.user_id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Mesaj gÃ¶nderilemedi.",
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
        description: "Arama sÄ±rasÄ±nda bir hata oluÅŸtu",
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

        toast({ title: "Sabitleme kaldÄ±rÄ±ldÄ±" });
      } else {
        await supabase
          .from("conversation_pins")
          .insert({
            user_id: currentUserId,
            conversation_type: conv.type,
            conversation_id: conv.id,
          });

        toast({ title: "KonuÅŸma sabitlendi" });
      }

      loadConversations();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Ä°ÅŸlem gerÃ§ekleÅŸtirilemedi.",
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

  // New V2 Conversation Item
  const ConversationItem = ({ conv, selected, onClick }: any) => {
    const isGroup = conv.type === 'group';
    const displayName = isGroup ? conv.group?.name : (conv.friend?.full_name || conv.friend?.username);
    const displayPhoto = isGroup ? conv.group?.photo_url : conv.friend?.profile_photo;
    const displayUsername = isGroup ? `${conv.group?.member_count || 0} Ã¼ye` : `@${conv.friend?.username}`;

    const lastMessageText = isGroup
      ? (conv.lastMessage ? `${conv.lastMessageSenderName}: ${conv.lastMessage.content}` : "HenÃ¼z mesaj yok")
      : (conv.lastMessage?.content || "");

    const lastMessageTime = conv.lastMessage?.created_at
      ? formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true, locale: tr })
      : "";

    return (
      <div
        className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 relative group border border-transparent ${selected ? "bg-white/10 border-white/10 shadow-glow-sm" : "hover:border-white/5"
          }`}
        onClick={onClick}
      >
        {conv.isPinned && (
          <Pin className="absolute top-2 right-2 w-3 h-3 text-primary animate-pulse" />
        )}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-transparent transition-all group-hover:ring-primary/50">
              <AvatarImage src={displayPhoto || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {isGroup ? <Users className="w-5 h-5" /> : displayName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isGroup && conv.friend?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
            )}
            {!isGroup && !conv.friend?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-600 rounded-full border-2 border-black"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold truncate text-white/90">{displayName}</p>
              <span className="text-[10px] text-white/40">{lastMessageTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <p className={`text-sm truncate flex-1 pr-2 ${conv.unreadCount > 0 ? "text-white font-medium" : "text-white/50"}`}>
                {lastMessageText.substring(0, 40)}
              </p>
              {conv.unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-glow-sm">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // MessageSearchResultItem
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

    const highlightText = (text: string) => {
      if (!searchQuery) return text;
      const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase()
          ? <span key={i} className="bg-primary/20 text-primary font-bold">{part}</span>
          : part
      );
    };

    return (
      <div
        className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={displayPhoto || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {isGroup ? <Users className="w-5 h-5" /> : displayName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate text-white/90">{displayName}</p>
              <span className="text-xs text-white/40">{messageTime}</span>
            </div>
            <p className="text-sm text-white/70 line-clamp-2">
              {highlightText(result.message.content)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent pb-20">
        <PageHeader title="Mesajlar" />
        <div className="container mx-auto px-4 mt-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <SkeletonConversationList count={6} />
            </div>
            <div className="md:col-span-2 hidden md:block">
              <Card className="h-[600px] glass-card flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pt-20 pb-20 md:pb-0 bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="-mt-6">
        <PageHeader title="Kozmik Mesajlar" />
      </div>

      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Analiz DetayÄ±</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <AnalysisDetailView
              result={selectedAnalysis}
              analysisType={selectedAnalysis.analysis_type}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md glass-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Mesaj Zamanla</DialogTitle>
            <DialogDescription className="text-white/60">
              Bu mesajÄ±n ne zaman gÃ¶nderilmesini istediÄŸinizi seÃ§in.
            </DialogDescription>
          </DialogHeader>
          <ScheduleMessageDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            receiverId={selectedFriend?.user_id || ""}
            receiverName={selectedFriend?.full_name || selectedFriend?.username || ""}
          />
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-4 md:py-8 h-[calc(100vh-140px)]">
        <div className="grid md:grid-cols-3 gap-6 h-full">

          {/* Sidebar */}
          <div className={`md:col-span-1 flex flex-col gap-4 h-full ${isMobile && selectedFriend ? 'hidden' : ''}`}>
            <Card className="glass-card flex-1 flex flex-col overflow-hidden border-white/10 shadow-xl bg-black/40 backdrop-blur-xl">
              <div className="p-4 space-y-4 border-b border-white/5">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={searchMode === "conversations" ? "Sohbetlerde ara..." : "Mesajlarda ara..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-white/10 pl-9 focus:bg-white/10 focus:border-primary/50 transition-all placeholder:text-white/30 h-10 rounded-xl"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
                <TabsList className="bg-transparent border-b border-white/5 px-4 justify-start gap-4 h-12 w-full overflow-x-auto no-scrollbar">
                  <TabsTrigger value="friends" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-white/60 rounded-full px-4 text-xs font-medium border border-transparent data-[state=active]:border-primary/20 flex gap-2 items-center">
                    ArkadaÅŸlar {friendUnreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </TabsTrigger>
                  <TabsTrigger value="matches" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent text-white/60 rounded-full px-4 text-xs font-medium border border-transparent data-[state=active]:border-accent/20 flex gap-2 items-center">
                    EÅŸleÅŸmeler {matchUnreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                  </TabsTrigger>
                  <TabsTrigger value="other" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-white/60 rounded-full px-4 text-xs font-medium border border-transparent data-[state=active]:border-purple-500/20 flex gap-2 items-center">
                    Diğer {otherUnreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-white/60 rounded-full px-4 text-xs font-medium border border-transparent data-[state=active]:border-blue-500/20">
                    Gruplar
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden relative bg-black/20">
                  {/* Friends Tab */}
                  <TabsContent value="friends" className="h-full mt-0">
                    <ScrollArea className="h-full p-2">
                      <div className="space-y-1">
                        {friendConversations.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-center px-4 space-y-3">
                            <div className="p-3 rounded-full bg-white/5">
                              <UserPlus className="w-6 h-6 text-white/40" />
                            </div>
                            <p className="text-sm text-white/50">HenÃ¼z mesajlaÅŸan arkadaÅŸÄ±n yok.</p>
                            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs" onClick={() => navigate("/discovery")}>
                              ArkadaÅŸ Bul
                            </Button>
                          </div>
                        ) : (
                          friendConversations.map(conv => (
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
                                className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-white/10 text-white/70"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePinConversation(conv);
                                }}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Matches Tab */}
                  <TabsContent value="matches" className="h-full mt-0">
                    <ScrollArea className="h-full p-2">
                      <div className="space-y-1">
                        {matchConversations.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-center px-4 space-y-3">
                            <div className="p-3 rounded-full bg-white/5">
                              <Heart className="w-6 h-6 text-accent" />
                            </div>
                            <p className="text-sm text-white/50">HenÃ¼z eÅŸleÅŸmen yok.</p>
                            <Button variant="outline" size="sm" className="border-accent/20 bg-accent/10 hover:bg-accent/20 text-accent text-xs" onClick={() => navigate("/match")}>
                              EÅŸleÅŸmelere Git
                            </Button>
                          </div>
                        ) : (
                          matchConversations.map(conv => (
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
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Other Tabs */}
                  <TabsContent value="groups" className="h-full mt-0">
                    {/* ... Group logic ... */}
                    <ScrollArea className="h-full p-2">
                      {groupConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                          <Users className="w-8 h-8 mb-2" />
                          <p className="text-sm">Grup bulunamadÄ±</p>
                        </div>
                      ) : (
                        groupConversations.map(conv => (
                          <div key={conv.id} className="relative group">
                            <ConversationItem
                              conv={conv}
                              selected={false}
                              onClick={() => navigate(`/groups/${conv.id}`)}
                            />
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="other" className="h-full mt-0">
                    <ScrollArea className="h-full p-2">
                      {otherConversations.map(conv => (
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
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`md:col-span-2 h-full flex flex-col ${isMobile && !selectedFriend ? 'hidden' : ''}`}>
            <Card className="glass-card flex-1 flex flex-col overflow-hidden border-white/10 relative bg-black/60 shadow-2xl backdrop-blur-xl">
              {selectedFriend ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 md:p-4 border-b border-white/5 flex items-center gap-3 bg-white/5 backdrop-blur-xl z-10 shadow-sm relative">
                    {/* Header Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50 pointer-events-none" />

                    {isMobile && (
                      <Button variant="ghost" size="icon" onClick={() => setSelectedFriend(null)} className="text-white/70 hover:bg-white/10 -ml-2">
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}

                    <div className="relative cursor-pointer" onClick={() => {
                      if (selectedCategory === "other") {
                        // Fetch full profile info for the temp profile if needed
                        const fetchTempProfile = async () => {
                          const { data } = await supabase.from('profiles').select('user_id, username, full_name, profile_photo, bio, birth_date').eq('user_id', selectedFriend.user_id).maybeSingle();
                          if (data) {
                            setTempProfileData(data);
                            setTempProfileOpen(true);
                          }
                        };
                        fetchTempProfile();
                      } else {
                        navigate(`/profile/${selectedFriend.username}`);
                      }
                    }}>
                      <Avatar className="w-10 h-10 border border-white/10 ring-2 ring-transparent hover:ring-primary/40 transition-all">
                        <AvatarImage src={selectedFriend.profile_photo} />
                        <AvatarFallback>{selectedFriend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {selectedFriend.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></span>
                      )}
                    </div>

                    <div className="flex-1 cursor-pointer" onClick={() => {
                      if (selectedCategory === "other") {
                        const fetchTempProfile = async () => {
                          const { data } = await supabase.from('profiles').select('user_id, username, full_name, profile_photo, bio, birth_date').eq('user_id', selectedFriend.user_id).maybeSingle();
                          if (data) {
                            setTempProfileData(data);
                            setTempProfileOpen(true);
                          }
                        };
                        fetchTempProfile();
                      } else {
                        navigate(`/profile/${selectedFriend.username}`);
                      }
                    }}>
                      <h3 className="font-semibold text-white leading-none mb-1">{selectedFriend.full_name || selectedFriend.username}</h3>
                      <p className="text-[10px] md:text-xs text-white/50 flex items-center gap-1.5">
                        {selectedFriend.is_online ? (
                          <span className="text-green-400 font-medium">â— Ã‡evrimiÃ§i</span>
                        ) : selectedFriend.last_seen ? (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(selectedFriend.last_seen), { locale: tr, addSuffix: true })}</span>
                        ) : "Ã‡evrimdÄ±ÅŸÄ±"}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {selectedCategory !== "other" ? (
                        <>
                          <Button size="icon" variant="ghost" className="text-white/70 hover:bg-primary/20 hover:text-primary transition-colors rounded-full" onClick={() => startCall("audio")}>
                            <Phone className="w-5 h-5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-white/70 hover:bg-accent/20 hover:text-accent transition-colors rounded-full" onClick={() => startCall("video")}>
                            <Video className="w-5 h-5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">
                          <Ban className="w-3 h-3" />
                          <span className="hidden md:inline">MesajlaÅŸma KapalÄ±</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4 bg-transparent">
                    <div className="space-y-6">
                      {/* Pinned Messages */}
                      {pinnedMessages.length > 0 && (
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 backdrop-blur-sm mx-auto max-w-sm mb-6">
                          <div className="flex items-center gap-2 mb-2 text-primary">
                            <Pin className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Sabitlenen Mesajlar</span>
                          </div>
                          <div className="space-y-2">
                            {pinnedMessages.slice(0, 2).map(pm => (
                              <div key={pm.id} className="text-xs text-white/70 truncate pl-5 border-l-2 border-primary/30 py-0.5 cursor-pointer hover:text-white" onClick={() => { }}>
                                {pm.content.substring(0, 50)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUserId;
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                        const isAnalysis = msg.analysis_id;

                        return (
                          <SwipeableMessage
                            key={msg.id}
                            onSwipeRight={() => handleReplyToMessage(msg.content)}
                            onSwipeLeft={isMe ? () => handleDeleteMessage(msg.id) : undefined}
                          >
                            <div className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} group transform transition-all duration-300 hover:translate-y-[-1px]`}>
                              {!isMe && (
                                <div className="w-8 flex-shrink-0 flex items-end">
                                  {showAvatar ? (
                                    <Avatar className="w-8 h-8 ring-1 ring-white/10">
                                      <AvatarImage src={selectedFriend.profile_photo} />
                                      <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                  ) : <div className="w-8" />}
                                </div>
                              )}

                              <div className={`flex flex-col max-w-[80%] md:max-w-[70%] min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                                {/* Content Bubble */}
                                <div className={`relative px-4 py-2.5 shadow-lg ${isMe
                                  ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary via-violet-600 to-violet-700 text-white border-0"
                                  : "rounded-2xl rounded-tl-sm bg-white/10 backdrop-blur-md border border-white/10 text-white/90"
                                  }`}>
                                  {/* Analysis Card Special Rendering */}
                                  {isAnalysis ? (
                                    <div className="min-w-[280px] sm:min-w-[320px] max-w-sm my-1">
                                      <SharedAnalysisCard
                                        analysisId={msg.analysis_id!}
                                        analysisType={msg.analysis_type!}
                                        compact={true}
                                      />
                                    </div>
                                  ) : (
                                    /* Normal Text Content */
                                    <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                                      {msg.content.replace(/\[.*?\]/g, "")}
                                    </p>
                                  )}

                                  {/* Timestamp & Status */}
                                  <div className={`flex items-center gap-1.5 mt-1 select-none ${isMe ? "justify-end text-white/70" : "justify-start text-white/40"}`}>
                                    <span className="text-[10px]">
                                      {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {isMe && (
                                      msg.read ? <CheckCheck className="w-3 h-3 text-blue-200" /> : <Check className="w-3 h-3" />
                                    )}
                                  </div>
                                </div>

                                {/* Reactions Row */}
                                <div className="-mt-1 z-10">
                                  <MessageReactions messageId={msg.id} currentUserId={currentUserId} />
                                </div>
                              </div>
                            </div>
                          </SwipeableMessage>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-3 md:p-4 bg-white/5 backdrop-blur-3xl border-t border-white/10 z-20">
                    {selectedCategory === "other" ? (
                      <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                        <ShieldMinus className="w-5 h-5" />
                        <span>Bu kiÅŸiyle mesajlaÅŸmak iÃ§in eÅŸleÅŸmeniz gerekir.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Attachments Preview */}
                        {attachedFile && (
                          <div className="flex items-center gap-3 p-2 bg-white/10 rounded-lg border border-white/10 animate-in slide-in-from-bottom-2">
                            <div className="p-2 bg-primary/20 rounded-md">
                              <Paperclip className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{attachedFile.name}</p>
                              <p className="text-xs text-white/50">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white/10 text-white/50" onClick={removeAttachment}>
                              âœ•
                            </Button>
                          </div>
                        )}

                        <div className="flex items-end gap-2">
                          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-end p-1 focus-within:bg-white/10 focus-within:border-primary/30 transition-all shadow-inner">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                              <Smile className="w-5 h-5" />
                            </Button>

                            <Input
                              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] py-3 text-white placeholder:text-white/30"
                              placeholder="Bir mesaj yazÄ±n..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            />

                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-white/50 hover:text-accent hover:bg-accent/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                              <Paperclip className="w-5 h-5" />
                              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                            </Button>
                          </div>

                          <Button
                            size="icon"
                            className={`h-12 w-12 rounded-2xl shadow-lg transition-all duration-300 ${newMessage.trim() || attachedFile ? "bg-gradient-to-r from-primary to-violet-600 hover:scale-105" : "bg-white/10 text-white/30 hover:bg-white/20"}`}
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() && !attachedFile}
                          >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                          </Button>
                        </div>

                        {/* Action Shortcuts */}
                        <div className="flex justify-between items-center px-1">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-xs gap-1.5" onClick={() => setShowVoiceRecorder(true)}>
                              <Mic className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ses</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-xs gap-1.5" onClick={() => setShowGifPicker(true)}>
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">GIF</span>
                            </Button>
                          </div>
                          <p className="text-[10px] text-white/20">Enter gÃ¶nderir â€¢ Shift+Enter satÄ±r baÅŸÄ±</p>
                        </div>

                        {/* Emoji/GIF Popovers handled via absolute positioning or portal */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-20 left-4 z-50 animate-in slide-in-from-bottom-5 fade-in">
                            <div className="bg-black/90 border border-white/10 rounded-xl shadow-2xl p-1">
                              <EmojiPicker onEmojiClick={onEmojiClick} theme={"dark" as any} width={320} height={400} />
                            </div>
                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 bg-gradient-to-b from-transparent to-primary/5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative p-6 bg-black/40 border border-white/10 rounded-3xl shadow-2xl ring-1 ring-white/5">
                      <MessageSquare className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Kozmik Sohbet</h3>
                    <p className="text-white/50">
                      Sol menÃ¼den bir arkadaÅŸÄ±nÄ±zÄ± seÃ§in veya yeni kozmik baÄŸlantÄ±lar kurmak iÃ§in keÅŸfe Ã§Ä±kÄ±n.
                    </p>
                  </div>
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full px-8" onClick={() => navigate('/match')}>
                    Yeni EÅŸleÅŸmeler Bul
                  </Button>
                </div>
              )}
            </Card>
          </div>

        </div>
      </main>

      {/* Dialogs */}
      {showCallInterface && (
        <VideoCallDialog
          isOpen={showCallInterface}
          onClose={() => {
            setShowCallInterface(false);
            setActiveCallId(null);
          }}
          callId={activeCallId || ""}
          callType={callType}
          friendId={selectedFriend?.user_id || ""}
          friendName={selectedFriend?.full_name || selectedFriend?.username || ""}
          friendPhoto={selectedFriend?.profile_photo}
          isIncoming={false}
        />
      )}

      {incomingCall && (
        <VideoCallDialog
          isOpen={!!incomingCall}
          onClose={async () => {
            if (ringtone) {
              ringtone.stop();
              setRingtone(null);
            }
            setIncomingCall(null);
          }}
          callId={incomingCall.callId}
          callType={incomingCall.callType}
          friendId={incomingCall.callerId}
          friendName={incomingCall.callerName}
          friendPhoto={incomingCall.callerPhoto}
          isIncoming={true}
        />
      )}

      {/* Temporary Profile Dialog for "Other" tab interaction */}
      <TemporaryProfileDialog
        open={tempProfileOpen}
        onOpenChange={setTempProfileOpen}
        profile={tempProfileData}
        isAdding={isAddingFriend}
        isRemoving={isRemovingMatch}
        onAddFriend={async () => {
          if (!tempProfileData || !currentUserId) return;
          setIsAddingFriend(true);
          try {
            // First check if they already sent us a request
            const { data: existingRequest } = await supabase
              .from("friends")
              .select("*")
              .eq("user_id", tempProfileData.user_id)
              .eq("friend_id", currentUserId)
              .maybeSingle();

            if (existingRequest && existingRequest.status === "pending") {
              // Accept the request
              await supabase
                .from("friends")
                .update({ status: "accepted" })
                .eq("id", existingRequest.id);

              toast({ title: "Arkadaş Eklendi! ✨", description: "Artık mesajlaşabilirsiniz." });
            } else {
              // Send new friend request
              const { error } = await supabase
                .from("friends")
                .insert({
                  user_id: currentUserId,
                  friend_id: tempProfileData.user_id,
                  status: "pending"
                });

              if (error) throw error;
              toast({ title: "İstek Gönderildi", description: "Arkadaşlık isteği başarıyla iletildi." });
            }
            setTempProfileOpen(false);
          } catch (error: any) {
            toast({ title: "Hata", description: "Bir hata oluştu.", variant: "destructive" });
          } finally {
            setIsAddingFriend(false);
          }
        }}
        onRemoveMatch={async () => {
          if (!tempProfileData || !currentUserId) return;
          setIsRemovingMatch(true);
          try {
            // Un-match them (insert a pass swipe or delete existing like)
            await supabase
              .from("swipes")
              .delete()
              .eq("user_id", currentUserId)
              .eq("target_user_id", tempProfileData.user_id);

            // Delete associated messages if necessary, but visually it will hide if category=other and no swipes
            // For now just update the conversation state manually or reload
            toast({ title: "Eşleşme Kaldırıldı" });
            setTempProfileOpen(false);
            window.location.reload(); // Hard reload to clear state cleanly
          } catch (error: any) {
            toast({ title: "Hata", description: "Bir hata oluştu.", variant: "destructive" });
          } finally {
            setIsRemovingMatch(false);
          }
        }}
      />

    </div>
  );
};

export default Messages;
