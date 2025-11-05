import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Phone, 
  Video, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock,
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { SkeletonCallHistoryGroup } from "@/components/SkeletonCallHistory";

interface CallLog {
  id: string;
  call_id: string;
  caller_id: string;
  receiver_id: string;
  call_type: "audio" | "video";
  status: "ringing" | "completed" | "missed" | "rejected" | "failed";
  duration: number;
  started_at: string;
  ended_at: string | null;
  caller_profile?: {
    username: string;
    full_name: string;
    profile_photo: string;
  };
  receiver_profile?: {
    username: string;
    full_name: string;
    profile_photo: string;
  };
}

const CallHistory = () => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);

      // Fetch call logs
      const { data: callLogs, error } = await supabase
        .from("call_logs")
        .select("*")
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      callLogs?.forEach(call => {
        userIds.add(call.caller_id);
        userIds.add(call.receiver_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) || []
      );

      // Combine data
      const enrichedCalls = callLogs?.map(call => ({
        ...call,
        call_type: call.call_type as "audio" | "video",
        status: call.status as "ringing" | "completed" | "missed" | "rejected" | "failed",
        caller_profile: profileMap.get(call.caller_id),
        receiver_profile: profileMap.get(call.receiver_id),
      })) || [];

      setCalls(enrichedCalls);
    } catch (error: any) {
      console.error("Error loading call history:", error);
      toast({
        title: "Hata",
        description: "Arama geçmişi yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (call: CallLog, isOutgoing: boolean) => {
    if (call.status === "missed" || call.status === "failed") {
      return <PhoneMissed className="w-5 h-5 text-destructive" />;
    }
    
    if (isOutgoing) {
      return call.call_type === "video" 
        ? <Video className="w-5 h-5 text-primary" />
        : <PhoneOutgoing className="w-5 h-5 text-primary" />;
    }
    
    return call.call_type === "video"
      ? <Video className="w-5 h-5 text-green-500" />
      : <PhoneIncoming className="w-5 h-5 text-green-500" />;
  };

  const getCallStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı";
      case "missed":
        return "Cevapsız";
      case "rejected":
        return "Reddedildi";
      case "failed":
        return "Başarısız";
      case "ringing":
        return "Çalıyor";
      default:
        return status;
    }
  };

  const handleCallBack = (call: CallLog) => {
    const isOutgoing = call.caller_id === currentUserId;
    const otherUserId = isOutgoing ? call.receiver_id : call.caller_id;
    const otherProfile = isOutgoing ? call.receiver_profile : call.caller_profile;
    
    // Navigate to messages page with the user
    navigate(`/messages?userId=${otherUserId}`);
  };

  const groupCallsByDate = (calls: CallLog[]) => {
    const groups: { [key: string]: CallLog[] } = {
      "Bugün": [],
      "Dün": [],
      "Bu Hafta": [],
      "Bu Ay": [],
      "Daha Eski": [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setDate(thisMonth.getDate() - 30);

    calls.forEach(call => {
      const callDate = new Date(call.started_at);
      
      if (callDate >= today) {
        groups["Bugün"].push(call);
      } else if (callDate >= yesterday) {
        groups["Dün"].push(call);
      } else if (callDate >= thisWeek) {
        groups["Bu Hafta"].push(call);
      } else if (callDate >= thisMonth) {
        groups["Bu Ay"].push(call);
      } else {
        groups["Daha Eski"].push(call);
      }
    });

    return groups;
  };

  const callGroups = groupCallsByDate(calls);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Arama Geçmişi</h1>
            <p className="text-muted-foreground">
              Tüm sesli ve görüntülü aramalarınız
            </p>
          </div>

          {isLoading ? (
            <SkeletonCallHistoryGroup count={4} />
          ) : calls.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Henüz arama yok</h3>
                <p className="text-sm text-muted-foreground">
                  Yaptığınız ve aldığınız aramalar burada görünecek
                </p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-6">
                {Object.entries(callGroups).map(([groupName, groupCalls]) => {
                  if (groupCalls.length === 0) return null;

                  return (
                    <div key={groupName}>
                      <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                        {groupName}
                      </h2>
                      <Card className="divide-y">
                        {groupCalls.map(call => {
                          const isOutgoing = call.caller_id === currentUserId;
                          const otherProfile = isOutgoing 
                            ? call.receiver_profile 
                            : call.caller_profile;
                          const displayName = otherProfile?.full_name || otherProfile?.username || "Bilinmeyen";

                          return (
                            <div
                              key={call.id}
                              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => handleCallBack(call)}
                            >
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={otherProfile?.profile_photo} />
                                  <AvatarFallback>
                                    {displayName[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getCallIcon(call, isOutgoing)}
                                    <h3 className="font-medium truncate">
                                      {displayName}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{isOutgoing ? "Giden" : "Gelen"}</span>
                                    <span>•</span>
                                    <span>{getCallStatusText(call.status)}</span>
                                    {call.status === "completed" && call.duration > 0 && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{formatDuration(call.duration)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(call.started_at), {
                                      addSuffix: true,
                                      locale: tr,
                                    })}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCallBack(call);
                                    }}
                                  >
                                    {call.call_type === "video" ? (
                                      <Video className="w-4 h-4" />
                                    ) : (
                                      <Phone className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default CallHistory;
