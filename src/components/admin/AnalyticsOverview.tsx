import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users, MousePointer, TrendingUp } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function AnalyticsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const [eventsCount, sessionsCount, uniqueUsers, topEvents] = await Promise.all([
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_events').select('user_id').then(({ data }) => 
          new Set(data?.filter(e => e.user_id).map(e => e.user_id)).size
        ),
        supabase
          .from('analytics_events')
          .select('event_type, event_name')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      // Count event types
      const eventTypeCounts: Record<string, number> = {};
      topEvents.data?.forEach(event => {
        eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
      });

      return {
        totalEvents: eventsCount.count || 0,
        totalSessions: sessionsCount.count || 0,
        uniqueUsers: uniqueUsers,
        eventTypeCounts,
      };
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Etkinlik</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalEvents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Kaydedilen tüm olaylar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aktif Oturumlar</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Toplam oturum sayısı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Benzersiz Kullanıcı</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.uniqueUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Aktif kullanıcılar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Çok Kullanılan</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.entries(stats?.eventTypeCounts || {})
              .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">En popüler etkinlik tipi</p>
        </CardContent>
      </Card>
    </div>
  );
}
