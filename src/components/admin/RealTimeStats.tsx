import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Activity, TrendingUp, Zap, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Stats {
  onlineNow: number;
  activeToday: number;
  totalUsers: number;
  activeThisWeek: number;
  avgSessionTime: number;
}

export function RealTimeStats() {
  const [stats, setStats] = useState<Stats>({
    onlineNow: 0,
    activeToday: 0,
    totalUsers: 0,
    activeThisWeek: 0,
    avgSessionTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(loadStats, 10000);
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const loadStats = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get online now (last seen within 5 minutes)
      const { count: onlineNow } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinutesAgo.toISOString());

      // Get active today
      const { count: activeToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', today.toISOString());

      // Get active this week
      const { count: activeThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', weekAgo.toISOString());

      // Calculate average session time from analytics
      const { data: sessions } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'session')
        .gte('created_at', today.toISOString())
        .limit(100);

      let avgSessionTime = 0;
      if (sessions && sessions.length > 0) {
        const durations = sessions
          .map(s => (s.event_data as any)?.duration)
          .filter(d => typeof d === 'number');
        
        if (durations.length > 0) {
          avgSessionTime = Math.round(
            durations.reduce((a, b) => a + b, 0) / durations.length / 60
          );
        }
      }

      setStats({
        onlineNow: onlineNow || 0,
        activeToday: activeToday || 0,
        totalUsers: totalUsers || 0,
        activeThisWeek: activeThisWeek || 0,
        avgSessionTime,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      icon: Activity,
      label: "Şu An Online",
      value: stats.onlineNow,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      pulse: true,
    },
    {
      icon: TrendingUp,
      label: "Bugün Aktif",
      value: stats.activeToday,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Users,
      label: "Bu Hafta Aktif",
      value: stats.activeThisWeek,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Zap,
      label: "Toplam Kullanıcı",
      value: stats.totalUsers,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Eye,
      label: "Ort. Oturum (dk)",
      value: stats.avgSessionTime,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.pulse && (
                  <Badge variant="outline" className="animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block" />
                    Live
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString('tr-TR')}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
