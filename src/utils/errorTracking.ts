import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface ErrorContext {
  [key: string]: any;
}

interface BrowserInfo {
  [key: string]: string | boolean;
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  viewport: string;
  online: boolean;
}

interface ErrorLogData {
  error_type: string;
  error_message: string;
  error_stack?: string;
  user_id?: string;
  url: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  browser_info?: BrowserInfo;
  fingerprint?: string;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private isInitialized = false;
  private breadcrumbs: Array<{ timestamp: number; message: string; category: string }> = [];
  private maxBreadcrumbs = 50;

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Initialize error tracking - sets up global error handlers
   */
  initialize() {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        severity: 'error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          severity: 'error',
          context: { type: 'unhandledRejection' },
        }
      );
    });

    this.isInitialized = true;
    console.log('✅ Error tracking initialized');
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(message: string, category: string = 'default') {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      message,
      category,
    });

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
    };
  }

  /**
   * Generate a fingerprint for grouping similar errors
   */
  private generateFingerprint(error: Error, context?: ErrorContext): string {
    const stack = error.stack || '';
    const message = error.message || '';
    const name = error.name || 'Error';
    
    // Create a simple hash from error details
    const key = `${name}:${message}:${stack.split('\n')[1] || ''}`;
    return btoa(key).substring(0, 32);
  }

  /**
   * Capture and log an error
   */
  async captureError(
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      userId?: string;
    } = {}
  ) {
    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const { severity = 'error', context = {}, userId } = options;

      // Get current user if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      // Prepare error data
      const errorData: ErrorLogData = {
        error_type: errorObj.name || 'Error',
        error_message: errorObj.message || String(error),
        error_stack: errorObj.stack,
        user_id: currentUserId,
        url: window.location.href,
        severity,
        context: {
          ...context,
          breadcrumbs: this.breadcrumbs,
        },
        browser_info: this.getBrowserInfo(),
        fingerprint: this.generateFingerprint(errorObj, context),
      };

      // Log to backend
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert([errorData]);

      if (dbError) {
        console.error('Failed to log error to backend:', dbError);
      }

      // Also log to console in development
      if (import.meta.env.DEV) {
        console.group(`🔴 ${severity.toUpperCase()}: ${errorData.error_type}`);
        console.error('Message:', errorData.error_message);
        console.error('Stack:', errorData.error_stack);
        console.log('Context:', context);
        console.log('Breadcrumbs:', this.breadcrumbs);
        console.groupEnd();
      }
    } catch (captureError) {
      console.error('Error while capturing error:', captureError);
    }
  }

  /**
   * Capture a message (non-error)
   */
  async captureMessage(
    message: string,
    options: {
      severity?: Extract<ErrorSeverity, 'info' | 'warning'>;
      context?: ErrorContext;
    } = {}
  ) {
    const { severity = 'info', context = {} } = options;
    
    await this.captureError(new Error(message), {
      severity,
      context: {
        ...context,
        messageType: 'manual',
      },
    });
  }

  /**
   * Set user context
   */
  setUser(userId: string | null) {
    if (userId) {
      this.addBreadcrumb(`User logged in: ${userId}`, 'auth');
    } else {
      this.addBreadcrumb('User logged out', 'auth');
    }
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Convenience functions
export const captureError = (error: Error | string, options?: Parameters<typeof errorTracker.captureError>[1]) =>
  errorTracker.captureError(error, options);

export const captureMessage = (message: string, options?: Parameters<typeof errorTracker.captureMessage>[1]) =>
  errorTracker.captureMessage(message, options);

export const addBreadcrumb = (message: string, category?: string) =>
  errorTracker.addBreadcrumb(message, category);

export const setUser = (userId: string | null) =>
  errorTracker.setUser(userId);
