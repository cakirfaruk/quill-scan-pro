import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export const CronJobDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['cron-dashboard'],
    queryFn: async () => {
      // Son 24 saat içindeki loglar
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentLogs, error: logsError } = await supabase
        .from('cron_job_logs')
        .select('*')
        .gte('started_at', oneDayAgo)
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (logsError) throw logsError;

      // Genel istatistikler
      const { data: allLogs, error: statsError } = await supabase
        .from('cron_job_logs')
        .select('status')
        .gte('started_at', oneDayAgo);
      
      if (statsError) throw statsError;

      const totalRuns = allLogs.length;
      const successRuns = allLogs.filter(l => l.status === 'success').length;
      const failedRuns = allLogs.filter(l => l.status === 'failed').length;
      const runningRuns = allLogs.filter(l => l.status === 'running').length;

      // Aktif cron job sayısı
      const { data: activeCrons } = await supabase.functions.invoke('manage-cron-job', {
        body: { action: 'list' }
      });

      const activeJobCount = activeCrons?.jobs?.filter((j: any) => j.active).length || 0;

      return {
        recentLogs,
        stats: {
          totalRuns,
          successRuns,
          failedRuns,
          runningRuns,
          activeJobCount,
          successRate: totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0,
        }
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Yükleniyor...
        </CardContent>
      </Card>
    );
  }

  const { recentLogs, stats } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Özet Widget'ları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Job'lar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeJobCount || 0}</div>
            <p className="text-xs text-muted-foreground">Çalışan zamanlamalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son 24 Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRuns || 0}</div>
            <p className="text-xs text-muted-foreground">Toplam çalışma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarılı</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.successRuns || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.successRate || 0}% başarı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.failedRuns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalRuns ? Math.round((stats.failedRuns / stats.totalRuns) * 100) : 0}% hata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çalışıyor</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats?.runningRuns || 0}</div>
            <p className="text-xs text-muted-foreground">Aktif çalışmalar</p>
          </CardContent>
        </Card>
      </div>

      {/* Sağlık Durumu */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Sağlığı</CardTitle>
          <CardDescription>Cron job sisteminin genel durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stats?.successRate && stats.successRate >= 90 ? 'bg-green-500' : stats?.successRate && stats.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="font-medium">Genel Sağlık</span>
              </div>
              <Badge variant={stats?.successRate && stats.successRate >= 90 ? "default" : stats?.successRate && stats.successRate >= 70 ? "secondary" : "destructive"}>
                {stats?.successRate && stats.successRate >= 90 ? 'İyi' : stats?.successRate && stats.successRate >= 70 ? 'Orta' : 'Kötü'}
              </Badge>
            </div>

            {stats && stats.failedRuns > 0 && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-destructive">Dikkat Gerekiyor</div>
                  <div className="text-sm text-muted-foreground">
                    Son 24 saatte {stats.failedRuns} başarısız çalışma tespit edildi. Lütfen logları kontrol edin.
                  </div>
                </div>
              </div>
            )}

            {stats && stats.successRate === 100 && (
              <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-primary">Mükemmel Performans</div>
                  <div className="text-sm text-muted-foreground">
                    Tüm cron job'lar başarıyla çalışıyor. Harika iş!
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Son Çalışmalar */}
      <Card>
        <CardHeader>
          <CardTitle>Son Çalışmalar</CardTitle>
          <CardDescription>En son 10 cron job çalışması</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentLogs || recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz çalışma geçmişi bulunmuyor
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {recentLogs.map((log: any) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {log.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {log.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                      {log.status === 'running' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                      
                      <div className="flex-1">
                        <div className="font-medium">{log.job_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.started_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.duration_ms && (
                        <Badge variant="outline" className="text-xs">
                          {log.duration_ms < 1000 
                            ? `${log.duration_ms}ms` 
                            : `${(log.duration_ms / 1000).toFixed(2)}s`}
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          log.status === 'success' ? 'default' :
                          log.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {log.status === 'success' ? 'Başarılı' :
                         log.status === 'failed' ? 'Hatalı' :
                         'Çalışıyor'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};