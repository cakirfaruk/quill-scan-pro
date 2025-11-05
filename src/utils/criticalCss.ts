/**
 * Critical CSS Utilities
 * Helper functions for managing critical CSS and performance
 */

import { initializePerformanceMonitoring } from './performanceMonitoring';
import { errorTracker } from './errorTracking';

/**
 * Preload critical resources
 * Call this early in app initialization
 */
export function preloadCriticalResources() {
  // Preload critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);
}

/**
 * Load non-critical CSS asynchronously
 */
export function loadNonCriticalCSS(href: string) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print'; // Load as print stylesheet first
  link.onload = function() {
    // Switch to 'all' media after loading
    link.media = 'all';
  };
  document.head.appendChild(link);
}

/**
 * Remove loading spinner when app is ready
 */
export function removeLoadingSpinner() {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) {
    // Hemen kaldır - React render olunca zaten kendi loading state'ini gösterecek
    spinner.remove();
  }
}

/**
 * Measure and log First Contentful Paint (FCP)
 */
export function measureFCP() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcpEntry) {
      console.log(`⚡ First Contentful Paint: ${fcpEntry.startTime.toFixed(2)}ms`);
      
      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'FCP',
          value: Math.round(fcpEntry.startTime),
          event_category: 'Performance'
        });
      }
    }
  }
}

/**
 * Measure and log Largest Contentful Paint (LCP)
 */
export function measureLCP() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        console.log(`⚡ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: 'LCP',
            value: Math.round(lastEntry.startTime),
            event_category: 'Performance'
          });
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP measurement not supported');
    }
  }
}

/**
 * Measure Time to Interactive (TTI)
 */
export function measureTTI() {
  if ('performance' in window && 'now' in performance) {
    window.addEventListener('load', () => {
      // Approximate TTI as when the load event fires
      const tti = performance.now();
      console.log(`⚡ Time to Interactive: ${tti.toFixed(2)}ms`);
      
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'TTI',
          value: Math.round(tti),
          event_category: 'Performance'
        });
      }
    });
  }
}

/**
 * Measure First Input Delay (FID)
 */
export function measureFID() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          console.log(`⚡ First Input Delay: ${fid.toFixed(2)}ms`);
          
          if (window.gtag) {
            window.gtag('event', 'timing_complete', {
              name: 'FID',
              value: Math.round(fid),
              event_category: 'Performance'
            });
          }
        });
      });
      
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID measurement not supported');
    }
  }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS() {
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      
      // Log CLS after page interaction
      window.addEventListener('beforeunload', () => {
        console.log(`⚡ Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
        
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: 'CLS',
            value: Math.round(clsValue * 1000),
            event_category: 'Performance'
          });
        }
      });
    } catch (e) {
      console.warn('CLS measurement not supported');
    }
  }
}

/**
 * Initialize all performance measurements
 */
export function initPerformanceMonitoring() {
  // Initialize error tracking
  errorTracker.initialize();
  
  // Initialize Web Vitals monitoring
  initializePerformanceMonitoring();
  
  // Wait for page to be fully interactive
  if (document.readyState === 'complete') {
    measureFCP();
    measureLCP();
    measureTTI();
    measureFID();
    measureCLS();
  } else {
    window.addEventListener('load', () => {
      measureFCP();
      measureLCP();
      measureTTI();
      measureFID();
      measureCLS();
    });
  }
}

/**
 * Add type for window.gtag
 */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
