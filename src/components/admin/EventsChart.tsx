import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format, subDays } from "date-fns";

export function EventsChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['admin-events-chart'],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'MMM dd'),
        };
      });

      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      const dailyStats = last7Days.map(day => {
        const dayEvents = events?.filter(e => 
          e.created_at.startsWith(day.date)
        ) || [];

        const pageViews = dayEvents.filter(e => e.event_type === 'page_view').length;
        const clicks = dayEvents.filter(e => e.event_type === 'click').length;
        const features = dayEvents.filter(e => e.event_type === 'feature_use').length;

        return {
          date: day.displayDate,
          'Sayfa Görüntüleme': pageViews,
          'Tıklama': clicks,
          'Özellik Kullanımı': features,
        };
      });

      return dailyStats;
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etkinlik Trendi</CardTitle>
        <CardDescription>Son 7 günlük kullanıcı aktivitesi</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="relative z-0">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
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
              <Line 
                type="monotone" 
                dataKey="Sayfa Görüntüleme" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Tıklama" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Özellik Kullanımı" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
