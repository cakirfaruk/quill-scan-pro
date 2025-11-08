import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { AlertCircle, TrendingUp, Activity, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface AlertLog {
  id: string;
  type: string;
  severity: string;
  message: string;
  sent_at: string;
  details: any;
}

interface AlertTypeStats {
  type: string;
  count: number;
}

interface SeverityStats {
  severity: string;
  count: number;
}

interface DailyStats {
  date: string;
  count: number;
}

const COLORS = {
  critical: "hsl(var(--destructive))",
  error: "hsl(var(--chart-1))",
  warning: "hsl(var(--chart-2))",
  info: "hsl(var(--chart-3))",
};

const SEVERITY_COLORS = ["hsl(var(--destructive))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export function AlertAnalytics() {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");

  useEffect(() => {
    fetchAlertLogs();
  }, [timeRange]);

  const fetchAlertLogs = async () => {
    try {
      setLoading(true);
      const daysAgo = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), daysAgo));

      const { data, error } = await supabase
        .from("alert_logs")
        .select("*")
        .gte("sent_at", startDate.toISOString())
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching alert logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Alert tip istatistikleri
  const typeStats: AlertTypeStats[] = logs.reduce((acc, log) => {
    const existing = acc.find(s => s.type === log.type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: log.type, count: 1 });
    }
    return acc;
  }, [] as AlertTypeStats[]).sort((a, b) => b.count - a.count);

  // Severity istatistikleri
  const severityStats: SeverityStats[] = logs.reduce((acc, log) => {
    const existing = acc.find(s => s.severity === log.severity);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ severity: log.severity, count: 1 });
    }
    return acc;
  }, [] as SeverityStats[]).sort((a, b) => b.count - a.count);

  // Günlük trend
  const dailyStats: DailyStats[] = (() => {
    const days = parseInt(timeRange);
    const stats: Record<string, number> = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), "yyyy-MM-dd");
      stats[date] = 0;
    }

    // Count alerts per day
    logs.forEach(log => {
      const date = format(new Date(log.sent_at), "yyyy-MM-dd");
      if (stats[date] !== undefined) {
        stats[date]++;
      }
    });

    return Object.entries(stats).map(([date, count]) => ({
      date: format(new Date(date), "d MMM", { locale: tr }),
      count,
    }));
  })();

  const totalAlerts = logs.length;
  const avgAlertsPerDay = totalAlerts / parseInt(timeRange);
  const mostCommonType = typeStats[0]?.type || "N/A";
  const criticalCount = logs.filter(l => l.severity === "critical").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Özet Kartlar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Alert</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Son {timeRange} gün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Günlük Ortalama</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAlertsPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Alert/gün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Çok Tetiklenen</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostCommonType}</div>
            <p className="text-xs text-muted-foreground">
              {typeStats[0]?.count || 0} kez
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Alertler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              {((criticalCount / totalAlerts) * 100 || 0).toFixed(1)}% toplam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zaman Aralığı Seçici */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="7">Son 7 Gün</TabsTrigger>
          <TabsTrigger value="30">Son 30 Gün</TabsTrigger>
          <TabsTrigger value="90">Son 90 Gün</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grafikler */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alert Tipleri */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Tipleri</CardTitle>
            <CardDescription>En çok tetiklenen alert tipleri</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="relative z-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="type" className="text-xs" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle>Önem Derecesi Dağılımı</CardTitle>
            <CardDescription>Alert severity seviyeleri</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="relative z-0">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ severity, count }) => `${severity}: ${count}`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {severityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Zaman Bazlı Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Zaman Bazlı Trend</CardTitle>
            <CardDescription>Günlük alert sayısı</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="relative z-0">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="Alert Sayısı"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
