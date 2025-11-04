import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, MessageCircle, Image as ImageIcon, Video, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface GroupStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

interface MemberStats {
  user_id: string;
  username: string;
  profile_photo: string | null;
  message_count: number;
  media_count: number;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface MediaStats {
  type: string;
  count: number;
}

export const GroupStats = ({ open, onOpenChange, groupId }: GroupStatsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalMedia, setTotalMedia] = useState(0);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [mediaStats, setMediaStats] = useState<MediaStats[]>([]);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open, groupId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total members
      const { count: memberCount } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      setTotalMembers(memberCount || 0);

      // Get all messages
      const { data: messages, error: messagesError } = await supabase
        .from("group_messages")
        .select("sender_id, media_url, media_type, created_at")
        .eq("group_id", groupId);

      if (messagesError) throw messagesError;

      setTotalMessages(messages?.length || 0);

      // Calculate media stats
      const mediaMessages = messages?.filter((m) => m.media_url) || [];
      setTotalMedia(mediaMessages.length);

      const imageCount = mediaMessages.filter((m) => m.media_type?.startsWith("image")).length;
      const videoCount = mediaMessages.filter((m) => m.media_type?.startsWith("video")).length;

      setMediaStats([
        { type: "Fotoğraf", count: imageCount },
        { type: "Video", count: videoCount },
      ]);

      // Calculate member stats
      const memberMessageCounts = new Map<string, { messages: number; media: number }>();
      messages?.forEach((msg) => {
        const current = memberMessageCounts.get(msg.sender_id) || { messages: 0, media: 0 };
        memberMessageCounts.set(msg.sender_id, {
          messages: current.messages + 1,
          media: current.media + (msg.media_url ? 1 : 0),
        });
      });

      // Get member profiles
      const memberIds = Array.from(memberMessageCounts.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, profile_photo")
        .in("user_id", memberIds);

      const memberStatsData = (profiles || [])
        .map((profile) => {
          const stats = memberMessageCounts.get(profile.user_id);
          return {
            user_id: profile.user_id,
            username: profile.username,
            profile_photo: profile.profile_photo,
            message_count: stats?.messages || 0,
            media_count: stats?.media || 0,
          };
        })
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, 10);

      setMemberStats(memberStatsData);

      // Calculate daily activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return startOfDay(date);
      });

      const dailyActivityData = last7Days.map((date) => {
        const count = messages?.filter((msg) => {
          const msgDate = startOfDay(new Date(msg.created_at));
          return msgDate.getTime() === date.getTime();
        }).length || 0;

        return {
          date: format(date, "dd MMM", { locale: tr }),
          count,
        };
      });

      setDailyActivity(dailyActivityData);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İstatistikler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#8b5cf6", "#ec4899"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Grup İstatistikleri</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="members">Üyeler</TabsTrigger>
              <TabsTrigger value="activity">Aktivite</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] pr-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Üye Sayısı</p>
                    </div>
                    <p className="text-2xl font-bold">{totalMembers}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Toplam Mesaj</p>
                    </div>
                    <p className="text-2xl font-bold">{totalMessages}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Medya</p>
                    </div>
                    <p className="text-2xl font-bold">{totalMedia}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Ortalama/Gün</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(totalMessages / 7)}
                    </p>
                  </Card>
                </div>

                {/* Media Distribution */}
                {mediaStats.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Medya Dağılımı</h3>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={mediaStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {mediaStats.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">En Aktif Üyeler</h3>
                  <div className="space-y-3">
                    {memberStats.map((member, index) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary w-6">
                            #{index + 1}
                          </span>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.profile_photo || undefined} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {member.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.media_count} medya
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{member.message_count}</p>
                          <p className="text-xs text-muted-foreground">mesaj</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Son 7 Gün Aktivitesi</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" name="Mesaj Sayısı" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
