import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FeatureUsage {
  feature: string;
  count: number;
  icon: string;
}

export function PopularFeatures() {
  const { data: features, isLoading } = useQuery({
    queryKey: ['popular-features'],
    queryFn: async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get page views from analytics
      const { data: pageViews } = await supabase
        .from('analytics_events')
        .select('page_path')
        .eq('event_type', 'page_view')
        .gte('created_at', oneWeekAgo.toISOString());

      // Count page visits
      const pathCounts: Record<string, number> = {};
      pageViews?.forEach(event => {
        const path = event.page_path || '/';
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      });

      // Map paths to feature names
      const featureMap: Record<string, { name: string; icon: string }> = {
        '/tarot': { name: 'Tarot Falı', icon: '🔮' },
        '/coffee-fortune': { name: 'Kahve Falı', icon: '☕' },
        '/birth-chart': { name: 'Doğum Haritası', icon: '⭐' },
        '/numerology': { name: 'Numeroloji', icon: '🔢' },
        '/compatibility': { name: 'Uyum Analizi', icon: '💕' },
        '/dream': { name: 'Rüya Tabiri', icon: '😴' },
        '/palmistry': { name: 'El Okuma', icon: '🖐️' },
        '/handwriting': { name: 'El Yazısı', icon: '✍️' },
        '/daily-horoscope': { name: 'Günlük Kehanet', icon: '🌙' },
        '/match': { name: 'Eşleşme', icon: '❤️' },
        '/feed': { name: 'Ana Sayfa', icon: '🏠' },
        '/messages': { name: 'Mesajlar', icon: '💬' },
      };

      const featureUsage: FeatureUsage[] = Object.entries(pathCounts)
        .map(([path, count]) => ({
          feature: featureMap[path]?.name || path,
          count,
          icon: featureMap[path]?.icon || '📊',
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return featureUsage;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...(features?.map(f => f.count) || [1]));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Popüler Özellikler</h2>
        <span className="text-xs text-muted-foreground ml-auto">(Son 7 gün)</span>
      </div>

      <div className="space-y-4">
        {features && features.length > 0 ? (
          features.map((feature, index) => {
            const percentage = (feature.count / maxCount) * 100;
            
            return (
              <div key={feature.feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="font-medium">{feature.feature}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{feature.count.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    index === 0 
                      ? "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" 
                      : "[&>div]:bg-primary"
                  }`}
                />
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Henüz veri yok
          </p>
        )}
      </div>
    </Card>
  );
}
