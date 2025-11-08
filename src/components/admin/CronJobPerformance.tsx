import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Clock, Activity, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

export const CronJobPerformance = () => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['cron-job-performance'],
    queryFn: async () => {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
      
      const { data: logs, error } = await supabase
        .from('cron_job_logs')
        .select('*')
        .gte('started_at', sevenDaysAgo.toISOString())
        .order('started_at', { ascending: true });
      
      if (error) throw error;

      // Günlük başarı oranı trendi
      const dailyStats = logs.reduce((acc: any, log: any) => {
        const date = format(new Date(log.started_at), 'yyyy-MM-dd', { locale: tr });
        if (!acc[date]) {
          acc[date] = { date, success: 0, failed: 0, total: 0, avgDuration: 0, durations: [] };
        }
        acc[date].total++;
        if (log.status === 'success') acc[date].success++;
        if (log.status === 'failed') acc[date].failed++;
        if (log.duration_ms) acc[date].durations.push(log.duration_ms);
        return acc;
      }, {});

      const trendData = Object.values(dailyStats).map((stat: any) => ({
        date: format(new Date(stat.date), 'dd MMM', { locale: tr }),
        successRate: stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0,
        failureRate: stat.total > 0 ? Math.round((stat.failed / stat.total) * 100) : 0,
        avgDuration: stat.durations.length > 0 
          ? Math.round(stat.durations.reduce((a: number, b: number) => a + b, 0) / stat.durations.length)
          : 0,
        total: stat.total,
      }));

      // Job bazında performans
      const jobStats = logs.reduce((acc: any, log: any) => {
        if (!acc[log.job_name]) {
          acc[log.job_name] = { name: log.job_name, success: 0, failed: 0, total: 0, durations: [] };
        }
        acc[log.job_name].total++;
        if (log.status === 'success') acc[log.job_name].success++;
        if (log.status === 'failed') acc[log.job_name].failed++;
        if (log.duration_ms) acc[log.job_name].durations.push(log.duration_ms);
        return acc;
      }, {});

      const jobPerformance = Object.values(jobStats).map((job: any) => ({
        name: job.name,
        successRate: job.total > 0 ? Math.round((job.success / job.total) * 100) : 0,
        avgDuration: job.durations.length > 0
          ? Math.round(job.durations.reduce((a: number, b: number) => a + b, 0) / job.durations.length)
          : 0,
        total: job.total,
        success: job.success,
        failed: job.failed,
      }));

      // Durum dağılımı
      const statusDistribution = [
        { name: 'Başarılı', value: logs.filter(l => l.status === 'success').length, color: 'hsl(var(--primary))' },
        { name: 'Başarısız', value: logs.filter(l => l.status === 'failed').length, color: 'hsl(var(--destructive))' },
        { name: 'Çalışıyor', value: logs.filter(l => l.status === 'running').length, color: 'hsl(var(--muted))' },
      ];

      // Genel metrikler
      const totalRuns = logs.length;
      const successRuns = logs.filter(l => l.status === 'success').length;
      const failedRuns = logs.filter(l => l.status === 'failed').length;
      const avgDuration = logs.filter(l => l.duration_ms).length > 0
        ? Math.round(logs.filter(l => l.duration_ms).reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.filter(l => l.duration_ms).length)
        : 0;

      // Trend hesaplama (son 3 gün vs önceki 3 gün)
      const recentLogs = logs.filter(l => new Date(l.started_at) >= subDays(new Date(), 3));
      const olderLogs = logs.filter(l => new Date(l.started_at) < subDays(new Date(), 3) && new Date(l.started_at) >= subDays(new Date(), 6));
      
      const recentSuccessRate = recentLogs.length > 0
        ? (recentLogs.filter(l => l.status === 'success').length / recentLogs.length) * 100
        : 0;
      const olderSuccessRate = olderLogs.length > 0
        ? (olderLogs.filter(l => l.status === 'success').length / olderLogs.length) * 100
        : 0;
      
      const successRateTrend = recentSuccessRate - olderSuccessRate;

      return {
        trendData,
        jobPerformance,
        statusDistribution,
        metrics: {
          totalRuns,
          successRuns,
          failedRuns,
          successRate: totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0,
          avgDuration,
          successRateTrend,
        }
      };
    },
    refetchInterval: 60000,
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

  const { trendData, jobPerformance, statusDistribution, metrics } = performanceData || {};

  return (
    <div className="space-y-6">
      {/* Özet Metrikler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Çalışma</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRuns || 0}</div>
            <p className="text-xs text-muted-foreground">Son 7 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            {metrics?.successRateTrend && metrics.successRateTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.successRateTrend && metrics.successRateTrend > 0 ? '+' : ''}
              {metrics?.successRateTrend?.toFixed(1) || 0}% son 3 gün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgDuration ? `${(metrics.avgDuration / 1000).toFixed(2)}s` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Çalışma süresi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics?.failedRuns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalRuns ? Math.round((metrics.failedRuns / metrics.totalRuns) * 100) : 0}% toplam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Başarı Oranı Trendi */}
      <Card>
        <CardHeader>
          <CardTitle>Başarı Oranı Trendi</CardTitle>
          <CardDescription>Son 7 günün günlük başarı oranları</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="hsl(var(--primary))" 
                name="Başarı Oranı (%)"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="failureRate" 
                stroke="hsl(var(--destructive))" 
                name="Hata Oranı (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ortalama Çalışma Süreleri */}
        <Card>
          <CardHeader>
            <CardTitle>Ortalama Çalışma Süreleri</CardTitle>
            <CardDescription>Günlük ortalama süre (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDuration" fill="hsl(var(--primary))" name="Ortalama Süre (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Durum Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
            <CardDescription>Son 7 gün toplam</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job Bazında Performans */}
      <Card>
        <CardHeader>
          <CardTitle>Job Bazında Performans</CardTitle>
          <CardDescription>Her job'ın performans metrikleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobPerformance?.map((job: any) => (
              <div key={job.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">{job.name}</div>
                  <Badge variant={job.successRate >= 90 ? "default" : job.successRate >= 70 ? "secondary" : "destructive"}>
                    {job.successRate}% başarı
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Toplam</div>
                    <div className="font-bold">{job.total}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Başarılı</div>
                    <div className="font-bold text-primary">{job.success}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Başarısız</div>
                    <div className="font-bold text-destructive">{job.failed}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ort. Süre</div>
                    <div className="font-bold">
                      {job.avgDuration ? `${(job.avgDuration / 1000).toFixed(2)}s` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};