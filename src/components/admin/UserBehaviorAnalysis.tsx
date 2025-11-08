import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
];

export function UserBehaviorAnalysis() {
  const { data: behaviorData, isLoading } = useQuery({
    queryKey: ['admin-user-behavior'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, page_path')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Event type distribution
      const eventTypes: Record<string, number> = {};
      events?.forEach(event => {
        eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
      });

      const eventTypeChart = Object.entries(eventTypes).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value,
      }));

      // Top pages
      const pages: Record<string, number> = {};
      events?.forEach(event => {
        if (event.page_path) {
          pages[event.page_path] = (pages[event.page_path] || 0) + 1;
        }
      });

      const topPages = Object.entries(pages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      return {
        eventTypeChart,
        topPages,
        totalEvents: events?.length || 0,
      };
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Etkinlik Tipi Dağılımı</CardTitle>
          <CardDescription>Son 1000 etkinliğin dağılımı</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="relative z-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={behaviorData?.eventTypeChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {behaviorData?.eventTypeChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>En Popüler Sayfalar</CardTitle>
          <CardDescription>En çok ziyaret edilen 10 sayfa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {behaviorData?.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                    {page.path}
                  </code>
                </div>
                <Badge variant="secondary">{page.count} ziyaret</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
