import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Skull,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  severity: ErrorSeverity;
  timestamp: string;
  url: string;
  fingerprint: string;
  count: number;
  resolved: boolean;
  context: any;
  browser_info: any;
}

interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
  url: string;
}

const ErrorMonitor = () => {
  const isMobile = useIsMobile();
  const [selectedSeverity, setSelectedSeverity] = useState<ErrorSeverity | 'all'>('all');

  // Fetch error logs
  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ['error-logs', selectedSeverity],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (selectedSeverity !== 'all') {
        query = query.eq('severity', selectedSeverity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  // Fetch performance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as PerformanceMetric[];
    },
  });

  // Error stats
  const errorStats = errors?.reduce(
    (acc, err) => {
      acc[err.severity] = (acc[err.severity] || 0) + 1;
      return acc;
    },
    {} as Record<ErrorSeverity, number>
  );

  // Performance stats
  const perfStats = metrics?.reduce(
    (acc, metric) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = { good: 0, 'needs-improvement': 0, poor: 0 };
      }
      acc[metric.metric_name][metric.rating]++;
      return acc;
    },
    {} as Record<string, Record<string, number>>
  );

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'fatal':
        return <Skull className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'fatal':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'needs-improvement':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Error Monitoring & Performance</h1>
        <Badge variant="outline">Live</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1 sm:mb-2">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-sm sm:text-base">Info</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{errorStats?.info || 0}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-1 sm:mb-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-sm sm:text-base">Warnings</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{errorStats?.warning || 0}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1 sm:mb-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-sm sm:text-base">Errors</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{errorStats?.error || 0}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-1 sm:mb-2">
            <Skull className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-sm sm:text-base">Fatal</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{errorStats?.fatal || 0}</p>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Severity Filter */}
          <div className="flex gap-2 flex-wrap overflow-x-auto">
            <Button
              variant={selectedSeverity === 'all' ? 'default' : 'outline'}
              size={isMobile ? 'sm' : 'default'}
              onClick={() => setSelectedSeverity('all')}
            >
              All
            </Button>
            {(['info', 'warning', 'error', 'fatal'] as ErrorSeverity[]).map((severity) => (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? 'default' : 'outline'}
                size={isMobile ? 'sm' : 'default'}
                onClick={() => setSelectedSeverity(severity)}
                className="capitalize"
              >
                {severity}
              </Button>
            ))}
          </div>

          {/* Error List */}
          <ScrollArea className={isMobile ? 'h-[500px]' : 'h-[600px]'}>
            <div className="space-y-3">
              {errorsLoading ? (
                <p className="text-center text-muted-foreground py-8">Yükleniyor...</p>
              ) : errors && errors.length > 0 ? (
                errors.map((error) => (
                  <Card 
                    key={error.id} 
                    className="p-4 space-y-3 cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => window.location.href = `/error/${error.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg border ${getSeverityColor(error.severity)}`}>
                          {getSeverityIcon(error.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                              {error.error_type}
                            </h3>
                            {error.count > 1 && (
                              <Badge variant="secondary">{error.count}x</Badge>
                            )}
                            {error.resolved && (
                              <Badge variant="outline" className="text-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {error.error_message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(error.timestamp), 'PPp', { locale: tr })}
                            </span>
                            <span className="truncate max-w-xs">{error.url}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error.error_stack && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
                          {error.error_stack}
                        </pre>
                      </details>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Henüz hata kaydı yok
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {Object.entries(perfStats || {}).map(([metric, ratings]) => {
              const total = ratings.good + ratings['needs-improvement'] + ratings.poor;
              const goodPercentage = ((ratings.good / total) * 100).toFixed(0);

              return (
                <Card key={metric} className="p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">{metric}</div>
                  <div className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{goodPercentage}%</div>
                  <div className="flex gap-1">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${(ratings.good / total) * 100}%` }}
                    />
                    <div
                      className="h-2 bg-yellow-500 rounded"
                      style={{ width: `${(ratings['needs-improvement'] / total) * 100}%` }}
                    />
                    <div
                      className="h-2 bg-red-500 rounded"
                      style={{ width: `${(ratings.poor / total) * 100}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Metrics List */}
          <ScrollArea className={isMobile ? 'h-[500px]' : 'h-[600px]'}>
            <div className="space-y-2">
              {metricsLoading ? (
                <p className="text-center text-muted-foreground py-8">Yükleniyor...</p>
              ) : metrics && metrics.length > 0 ? (
                metrics.map((metric) => (
                  <Card key={metric.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRatingIcon(metric.rating)}
                        <div>
                          <div className="font-semibold">{metric.metric_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(metric.timestamp), 'PPp', { locale: tr })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">
                          {metric.metric_value.toFixed(2)}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            metric.rating === 'good'
                              ? 'text-green-500'
                              : metric.rating === 'needs-improvement'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          }
                        >
                          {metric.rating}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Henüz metrik kaydı yok
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorMonitor;
