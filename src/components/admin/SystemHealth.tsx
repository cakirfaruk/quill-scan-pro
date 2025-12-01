import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Database, Server, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HealthMetric {
  name: string;
  status: "healthy" | "warning" | "error";
  value: number;
  threshold: number;
  icon: any;
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthMetrics();
    
    const interval = setInterval(loadHealthMetrics, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadHealthMetrics = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check database response time
      const dbStart = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      // Check error rate (last hour)
      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneHourAgo.toISOString());

      // Check analytics events (last hour)
      const { count: eventCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo.toISOString());

      const healthMetrics: HealthMetric[] = [
        {
          name: "Veritabanı",
          status: dbLatency < 100 ? "healthy" : dbLatency < 300 ? "warning" : "error",
          value: dbLatency,
          threshold: 100,
          icon: Database,
        },
        {
          name: "Hata Oranı",
          status: (errorCount || 0) < 10 ? "healthy" : (errorCount || 0) < 50 ? "warning" : "error",
          value: errorCount || 0,
          threshold: 10,
          icon: AlertCircle,
        },
        {
          name: "Aktivite",
          status: (eventCount || 0) > 100 ? "healthy" : (eventCount || 0) > 10 ? "warning" : "error",
          value: eventCount || 0,
          threshold: 100,
          icon: Zap,
        },
      ];

      setMetrics(healthMetrics);
    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return CheckCircle2;
      case "warning":
        return AlertCircle;
      case "error":
        return XCircle;
      default:
        return Server;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Sağlıklı</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Uyarı</Badge>;
      case "error":
        return <Badge variant="destructive">Hata</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const overallStatus = metrics.every(m => m.status === "healthy") 
    ? "healthy" 
    : metrics.some(m => m.status === "error") 
    ? "error" 
    : "warning";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Sistem Sağlığı</h2>
        </div>
        {getStatusBadge(overallStatus)}
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const StatusIcon = getStatusIcon(metric.status);
          const percentage = Math.min((metric.value / metric.threshold) * 100, 100);
          
          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {metric.name === "Veritabanı" ? `${metric.value}ms` : metric.value}
                  </span>
                  <StatusIcon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                </div>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${
                  metric.status === "healthy" 
                    ? "[&>div]:bg-green-500" 
                    : metric.status === "warning"
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-red-500"
                }`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
