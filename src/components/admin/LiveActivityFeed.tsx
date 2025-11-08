import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, Zap, Users } from "lucide-react";
import { format } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'event' | 'error' | 'metric' | 'session';
  message: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'critical';
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Listen to all activity types
    const channel = supabase
      .channel('live-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          const event = payload.new as any;
          addActivity({
            id: event.id,
            type: 'event',
            message: `${event.event_type}: ${event.event_name}`,
            timestamp: new Date(event.created_at),
            severity: 'info',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          const error = payload.new as any;
          addActivity({
            id: error.id,
            type: 'error',
            message: error.error_message,
            timestamp: new Date(error.timestamp),
            severity: error.severity,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_metrics',
        },
        (payload) => {
          const metric = payload.new as any;
          addActivity({
            id: metric.id,
            type: 'metric',
            message: `${metric.metric_name}: ${Math.round(metric.metric_value)}ms`,
            timestamp: new Date(metric.created_at),
            severity: metric.metric_value > 3000 ? 'warning' : 'info',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_sessions',
        },
        (payload) => {
          const session = payload.new as any;
          addActivity({
            id: session.id,
            type: 'session',
            message: 'Yeni oturum başlatıldı',
            timestamp: new Date(session.started_at),
            severity: 'info',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addActivity = (activity: ActivityItem) => {
    setActivities((prev) => [activity, ...prev].slice(0, 50)); // Keep last 50 items
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'metric':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'session':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canlı Aktivite Akışı</CardTitle>
        <CardDescription>
          Gerçek zamanlı sistem aktiviteleri - {activities.length} etkinlik
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz aktivite yok... Canlı veri bekleniyor
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="mt-1">{getIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {format(activity.timestamp, 'HH:mm:ss')}
                      </span>
                      <Badge variant={getSeverityColor(activity.severity) as any} className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
