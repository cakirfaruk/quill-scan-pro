import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface CronJobLog {
  id: string;
  job_name: string;
  job_id: number | null;
  status: 'success' | 'failed' | 'running';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  details: Record<string, any>;
  created_at: string;
}

interface CronJobHistoryProps {
  jobName?: string;
}

export const CronJobHistory = ({ jobName }: CronJobHistoryProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['cron-job-logs', jobName],
    queryFn: async () => {
      let query = supabase
        .from('cron_job_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (jobName) {
        query = query.eq('job_name', jobName);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CronJobLog[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: "default",
      failed: "destructive",
      running: "secondary",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === 'success' ? 'Başarılı' : 
         status === 'failed' ? 'Hatalı' : 
         status === 'running' ? 'Çalışıyor' : status}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}dk`;
  };

  const getSuccessRate = () => {
    if (!logs || logs.length === 0) return 0;
    const successCount = logs.filter(log => log.status === 'success').length;
    return Math.round((successCount / logs.length) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Yükleniyor...
        </CardContent>
      </Card>
    );
  }

  const successRate = getSuccessRate();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Çalışma Geçmişi
              </CardTitle>
              <CardDescription>
                {jobName ? `${jobName} için son çalışmalar` : 'Tüm cron job çalışmaları'}
              </CardDescription>
            </div>
            {logs && logs.length > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{successRate}%</div>
                <div className="text-xs text-muted-foreground">Başarı Oranı</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz çalışma geçmişi bulunmuyor
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="border-l-4" style={{
                    borderLeftColor: 
                      log.status === 'success' ? 'hsl(var(--primary))' :
                      log.status === 'failed' ? 'hsl(var(--destructive))' :
                      'hsl(var(--muted))'
                  }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="font-semibold">{log.job_name}</span>
                            {getStatusBadge(log.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Başlangıç:</span>
                              <div className="font-medium">
                                {formatDistanceToNow(new Date(log.started_at), {
                                  addSuffix: true,
                                  locale: tr,
                                })}
                              </div>
                            </div>
                            
                            {log.duration_ms && (
                              <div>
                                <span className="text-muted-foreground">Süre:</span>
                                <div className="font-medium">{formatDuration(log.duration_ms)}</div>
                              </div>
                            )}
                          </div>

                          {log.error_message && (
                            <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                              <div className="font-semibold text-destructive mb-1">Hata:</div>
                              <div className="text-muted-foreground">{log.error_message}</div>
                            </div>
                          )}

                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                Detayları göster
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
