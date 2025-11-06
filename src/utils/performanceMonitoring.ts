/**
 * Performance monitoring utilities
 * Track and optimize app performance
 */

// Track First Contentful Paint
export function trackFCP(): void {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Ignore errors in unsupported browsers
    }
  }
}

// Track Largest Contentful Paint
export function trackLCP(): void {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Ignore errors
    }
  }
}

// Track Time to Interactive
export function trackTTI(): void {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('TTI:', entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    } catch (e) {
      // Ignore errors
    }
  }
}

// Memory usage monitoring (only in development)
export function monitorMemory(): void {
  if (import.meta.env.DEV && 'memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      console.log({
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      });
    }, 30000); // Every 30 seconds
  }
}

// Bundle size analyzer helper
export function logBundleInfo(): void {
  if (import.meta.env.DEV) {
    console.log('Bundle Info:', {
      mode: import.meta.env.MODE,
      base: import.meta.env.BASE_URL,
    });
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring(): void {
  if (import.meta.env.PROD) {
    trackFCP();
    trackLCP();
    trackTTI();
  } else {
    monitorMemory();
    logBundleInfo();
  }
}
