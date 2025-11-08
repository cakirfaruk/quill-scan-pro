/**
 * Hook for real-time analytics updates
 * Listens to analytics events, errors, and performance metrics
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeAnalytics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔴 Setting up realtime analytics listeners...');

    // Listen to analytics events
    const analyticsChannel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          console.log('📊 New analytics event:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['admin-analytics-overview'] });
          queryClient.invalidateQueries({ queryKey: ['admin-events-chart'] });
          queryClient.invalidateQueries({ queryKey: ['admin-user-behavior'] });
        }
      )
      .subscribe();

    // Listen to error logs
    const errorsChannel = supabase
      .channel('errors-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          console.log('🔴 New error logged:', payload);
          
          const error = payload.new as any;
          
          // Trigger alert for critical errors
          if (error.severity === 'critical') {
            supabase.functions.invoke('send-alert', {
              body: {
                type: 'error',
                severity: 'critical',
                message: `Critical error: ${error.error_type}`,
                details: {
                  message: error.error_message,
                  url: error.url,
                  stack: error.error_stack,
                },
              },
            }).catch(console.error);

            toast({
              title: '🚨 Critical Error Detected',
              description: error.error_message,
              variant: 'destructive',
            });
          }
          
          // Invalidate error logs query
          queryClient.invalidateQueries({ queryKey: ['admin-error-logs'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          console.log('✅ Error updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-error-logs'] });
        }
      )
      .subscribe();

    // Listen to performance metrics
    const performanceChannel = supabase
      .channel('performance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'performance_metrics',
        },
        (payload) => {
          console.log('⚡ New performance metric:', payload);
          
          const metric = payload.new as any;
          
          // Trigger alert for slow performance
          if (metric.metric_value > 3000) {
            supabase.functions.invoke('send-alert', {
              body: {
                type: 'performance',
                severity: 'high',
                message: `Slow performance detected: ${metric.metric_name}`,
                details: {
                  value: metric.metric_value,
                  page: metric.page_path,
                },
              },
            }).catch(console.error);

            toast({
              title: '⚠️ Performance Warning',
              description: `${metric.metric_name}: ${Math.round(metric.metric_value)}ms`,
              variant: 'default',
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['admin-performance-metrics'] });
        }
      )
      .subscribe();

    // Listen to session updates
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        (payload) => {
          console.log('👤 Session change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-analytics-overview'] });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔴 Cleaning up realtime listeners...');
      supabase.removeChannel(analyticsChannel);
      supabase.removeChannel(errorsChannel);
      supabase.removeChannel(performanceChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [queryClient, toast]);
}
