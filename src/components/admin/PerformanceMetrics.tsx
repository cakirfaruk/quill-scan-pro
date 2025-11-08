import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function PerformanceMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-performance-metrics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('performance_metrics')
        .select('metric_name, metric_value')
        .order('created_at', { ascending: false })
        .limit(100);

      // Group by metric name and calculate average
      const grouped: Record<string, { total: number; count: number }> = {};
      
      data?.forEach(metric => {
        const name = metric.metric_name;
        if (!grouped[name]) {
          grouped[name] = { total: 0, count: 0 };
        }
        grouped[name].total += Number(metric.metric_value);
        grouped[name].count += 1;
      });

      // Calculate averages and format for chart
      return Object.entries(grouped)
        .map(([name, { total, count }]) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          'Ortalama (ms)': Math.round(total / count),
          'Çağrı Sayısı': count,
        }))
        .sort((a, b) => b['Çağrı Sayısı'] - a['Çağrı Sayısı'])
        .slice(0, 10);
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performans Metrikleri</CardTitle>
        <CardDescription>En çok ölçülen 10 metrik ve ortalamaları</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="Ortalama (ms)" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
