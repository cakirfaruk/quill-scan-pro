/**
 * Shared logging utility for edge functions
 * Provides structured error logging, performance tracking, and monitoring
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

interface LogContext {
  functionName: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  functionName: string;
  duration: number;
  timestamp: string;
  success: boolean;
  errorType?: string;
}

/**
 * Log error to Supabase error_logs table with full context
 */
export async function logError(
  error: Error | string,
  context: LogContext,
  severity: 'error' | 'warning' | 'critical' = 'error'
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? null : error.stack;
    const errorType = typeof error === 'string' ? 'Error' : error.constructor.name;

    // Generate unique fingerprint for error deduplication
    const fingerprint = generateErrorFingerprint(errorMessage, context.functionName);

    const logEntry = {
      error_message: errorMessage,
      error_stack: errorStack,
      error_type: errorType,
      severity,
      url: `/functions/v1/${context.functionName}`,
      user_id: context.userId || null,
      timestamp: new Date().toISOString(),
      fingerprint,
      context: {
        functionName: context.functionName,
        requestId: context.requestId,
        ...context.metadata,
      },
      browser_info: {
        runtime: 'Deno',
        version: Deno.version.deno,
      },
    };

    const { error: dbError } = await supabase
      .from('error_logs')
      .insert(logEntry);

    if (dbError) {
      console.error('Failed to log error to database:', dbError);
    }

    // Console log for immediate visibility
    console.error(`[${severity.toUpperCase()}] ${context.functionName}:`, {
      message: errorMessage,
      userId: context.userId,
      requestId: context.requestId,
      metadata: context.metadata,
    });
  } catch (loggingError) {
    // Fallback to console if database logging fails
    console.error('Logging system error:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Track performance metrics for edge function execution
 */
export async function logPerformance(metrics: PerformanceMetrics): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_name: `edge_function_${metrics.functionName}`,
        metric_value: metrics.duration,
        timestamp: metrics.timestamp,
        metadata: {
          success: metrics.success,
          errorType: metrics.errorType,
        },
      });

    if (error) {
      console.error('Failed to log performance metrics:', error);
    }

    console.info(`[PERFORMANCE] ${metrics.functionName}: ${metrics.duration}ms`, {
      success: metrics.success,
      errorType: metrics.errorType,
    });
  } catch (err) {
    console.error('Performance logging error:', err);
  }
}

/**
 * Log successful function execution with context
 */
export function logSuccess(
  context: LogContext,
  details?: Record<string, any>
): void {
  console.info(`[SUCCESS] ${context.functionName}`, {
    userId: context.userId,
    requestId: context.requestId,
    ...details,
  });
}

/**
 * Log function execution start
 */
export function logStart(context: LogContext): void {
  console.info(`[START] ${context.functionName}`, {
    userId: context.userId,
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate unique fingerprint for error deduplication
 */
function generateErrorFingerprint(message: string, functionName: string): string {
  const combined = `${functionName}:${message.substring(0, 100)}`;
  return btoa(combined).substring(0, 32);
}

/**
 * Wrapper for edge function handlers with automatic logging
 */
export function withLogging<T>(
  functionName: string,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    
    const context: LogContext = {
      functionName,
      requestId,
    };

    logStart(context);

    try {
      const response = await handler(req);
      const duration = performance.now() - startTime;

      await logPerformance({
        functionName,
        duration,
        timestamp: new Date().toISOString(),
        success: response.ok,
      });

      logSuccess(context, { 
        status: response.status,
        duration: `${duration.toFixed(2)}ms` 
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      await logError(error as Error, context, 'error');
      
      await logPerformance({
        functionName,
        duration,
        timestamp: new Date().toISOString(),
        success: false,
        errorType: (error as Error).constructor.name,
      });

      throw error;
    }
  };
}

/**
 * Create logger instance for a specific function
 */
export function createLogger(functionName: string) {
  return {
    error: (error: Error | string, metadata?: Record<string, any>) =>
      logError(error, { functionName, metadata }, 'error'),
    
    warning: (error: Error | string, metadata?: Record<string, any>) =>
      logError(error, { functionName, metadata }, 'warning'),
    
    critical: (error: Error | string, metadata?: Record<string, any>) =>
      logError(error, { functionName, metadata }, 'critical'),
    
    success: (details?: Record<string, any>) =>
      logSuccess({ functionName }, details),
    
    performance: (duration: number, success: boolean, errorType?: string) =>
      logPerformance({
        functionName,
        duration,
        timestamp: new Date().toISOString(),
        success,
        errorType,
      }),
  };
}