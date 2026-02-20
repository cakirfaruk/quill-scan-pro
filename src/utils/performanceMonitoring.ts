import { supabase } from '@/integrations/supabase/client';

type MetricName = 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface PerformanceMetricData {
  user_id?: string;
  url: string;
  metric_name: MetricName;
  metric_value: number;
  rating: MetricRating;
  user_agent?: string;
  connection_type?: string;
  device_type?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isInitialized = false;
  private metrics: Map<MetricName, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize Web Vitals tracking
   */
  async initialize() {
    if (this.isInitialized) return;

    // Dynamically import web-vitals
    try {
      const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      // Track Core Web Vitals
      onCLS(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));

      this.isInitialized = true;
      console.log('✅ Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Handle Web Vitals metric
   */
  private async handleMetric(metric: any) {
    const { name, value, rating } = metric;
    
    this.metrics.set(name as MetricName, value);

    // Log to backend
    await this.logMetric({
      metric_name: name as MetricName,
      metric_value: value,
      rating: rating as MetricRating,
      url: window.location.href,
      user_agent: navigator.userAgent,
      connection_type: this.getConnectionType(),
      device_type: this.getDeviceType(),
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${name}: ${value.toFixed(2)} (${rating})`);
    }
  }

  /**
   * Log metric to backend
   */
  private async logMetric(data: Omit<PerformanceMetricData, 'user_id'>) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const metricData: PerformanceMetricData = {
        ...data,
        user_id: user?.id,
      };

      const { error } = await supabase
        .from('performance_metrics')
        .insert([metricData]);

      if (error) {
        console.error('Failed to log performance metric:', error);
      }
    } catch (error) {
      console.error('Error logging performance metric:', error);
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get all metrics
   */
  getMetrics(): Map<MetricName, number> {
    return new Map(this.metrics);
  }

  /**
   * Get metric rating thresholds
   */
  static getThresholds(metricName: MetricName): { good: number; poor: number } {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };
    return thresholds[metricName];
  }

  /**
   * Calculate rating for a metric value
   */
  static getRating(metricName: MetricName, value: number): MetricRating {
    const { good, poor } = PerformanceMonitor.getThresholds(metricName);
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience function
export const initializePerformanceMonitoring = () => performanceMonitor.initialize();
