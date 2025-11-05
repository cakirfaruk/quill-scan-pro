import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Users, Activity } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  timestamp: string;
  user_id?: string;
  fingerprint?: string;
  url: string;
}

export default function ErrorAnalytics() {
  const { data: errorLogs = [], isLoading } = useQuery({
    queryKey: ['error-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  // Calculate metrics
  const last7Days = subDays(new Date(), 7);
  const recentErrors = errorLogs.filter(e => new Date(e.timestamp) >= last7Days);
  
  const uniqueUsers = new Set(errorLogs.filter(e => e.user_id).map(e => e.user_id)).size;
  const criticalErrors = errorLogs.filter(e => e.severity === 'fatal' || e.severity === 'error').length;
  
  // Trend data - errors per day for last 7 days
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayErrors = errorLogs.filter(e => {
      const errorDate = new Date(e.timestamp);
      return errorDate >= dayStart && errorDate < dayEnd;
    });
    
    return {
      date: format(date, 'dd MMM', { locale: tr }),
      errors: dayErrors.length,
      critical: dayErrors.filter(e => e.severity === 'fatal' || e.severity === 'error').length,
    };
  });

  // Most common errors (by fingerprint or error_type)
  const errorCounts = errorLogs.reduce((acc, err) => {
    const key = err.fingerprint || err.error_type;
    if (!acc[key]) {
      acc[key] = { count: 0, type: err.error_type, severity: err.severity };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { count: number; type: string; severity: string }>);

  const topErrors = Object.entries(errorCounts)
    .map(([key, value]) => ({ error: value.type, count: value.count, severity: value.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Severity distribution
  const severityData = [
    { name: 'Bilgi', value: errorLogs.filter(e => e.severity === 'info').length, color: 'hsl(var(--chart-1))' },
    { name: 'Uyarı', value: errorLogs.filter(e => e.severity === 'warning').length, color: 'hsl(var(--chart-2))' },
    { name: 'Hata', value: errorLogs.filter(e => e.severity === 'error').length, color: 'hsl(var(--chart-3))' },
    { name: 'Kritik', value: errorLogs.filter(e => e.severity === 'fatal').length, color: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Hata Analitiği</h1>
        <p className="text-muted-foreground">Hata trendleri, en sık hatalar ve etkilenen kullanıcılar</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Hata</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorLogs.length}</div>
            <p className="text-xs text-muted-foreground">Son 7 gün: {recentErrors.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Hatalar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {((criticalErrors / errorLogs.length) * 100).toFixed(1)}% toplam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etkilenen Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Benzersiz kullanıcılar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama/Gün</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(recentErrors.length / 7).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Son 7 gün</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
          <TabsTrigger value="top-errors">En Sık Hatalar</TabsTrigger>
          <TabsTrigger value="severity">Önem Dağılımı</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hata Trendi (Son 7 Gün)</CardTitle>
              <CardDescription>Günlük hata sayıları ve kritik hatalar</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  errors: {
                    label: "Toplam Hata",
                    color: "hsl(var(--chart-1))",
                  },
                  critical: {
                    label: "Kritik Hata",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                      name="Toplam Hata"
                    />
                    <Area
                      type="monotone"
                      dataKey="critical"
                      stackId="2"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                      name="Kritik Hata"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En Sık Karşılaşılan Hatalar</CardTitle>
              <CardDescription>Hata tipine göre en çok tekrar eden hatalar</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Hata Sayısı",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topErrors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="error" 
                      type="category" 
                      width={150}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Sayı" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <ScrollArea className="h-[300px] mt-4">
                <div className="space-y-2">
                  {topErrors.map((error, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{error.error}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <Badge variant="outline">{error.count} kez</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Önem Seviyesi Dağılımı</CardTitle>
              <CardDescription>Hataların önem seviyelerine göre dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  info: {
                    label: "Bilgi",
                    color: "hsl(var(--chart-1))",
                  },
                  warning: {
                    label: "Uyarı",
                    color: "hsl(var(--chart-2))",
                  },
                  error: {
                    label: "Hata",
                    color: "hsl(var(--chart-3))",
                  },
                  fatal: {
                    label: "Kritik",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {severityData.map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
