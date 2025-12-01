import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  endpoint: string; // Endpoint identifier
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Check and enforce rate limiting for a user on a specific endpoint
 * Uses database-backed rate limiting for distributed systems
 */
export async function checkRateLimit(
  supabaseClient: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Check existing rate limit record
    const { data: rateLimit, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', config.endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      // Allow request on error but log it
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Check if rate limit exceeded
    if (rateLimit && rateLimit.request_count >= config.maxRequests) {
      const resetAt = new Date(new Date(rateLimit.window_start).getTime() + config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
      };
    }

    // Update or create rate limit record
    if (rateLimit) {
      // Increment existing record
      await supabaseClient
        .from('rate_limits')
        .update({ 
          request_count: rateLimit.request_count + 1,
          last_request_at: now.toISOString()
        })
        .eq('id', rateLimit.id);

      return {
        allowed: true,
        remaining: config.maxRequests - (rateLimit.request_count + 1),
        resetAt: new Date(new Date(rateLimit.window_start).getTime() + config.windowMs),
      };
    } else {
      // Create new record
      await supabaseClient
        .from('rate_limits')
        .insert({
          user_id: userId,
          endpoint: config.endpoint,
          request_count: 1,
          window_start: now.toISOString(),
          last_request_at: now.toISOString()
        });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }
  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow request on error but log it
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

/**
 * IP-based rate limiting for unauthenticated requests
 * More aggressive limits for anonymous users
 */
export async function checkIPRateLimit(
  supabaseClient: SupabaseClient,
  ipAddress: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Check existing IP rate limit record
    const { data: rateLimit, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', config.endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('IP rate limit fetch error:', fetchError);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Check if rate limit exceeded
    if (rateLimit && rateLimit.request_count >= config.maxRequests) {
      const resetAt = new Date(new Date(rateLimit.window_start).getTime() + config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Too many requests from this IP. Try again after ${resetAt.toISOString()}`,
      };
    }

    // Update or create rate limit record
    if (rateLimit) {
      await supabaseClient
        .from('rate_limits')
        .update({ 
          request_count: rateLimit.request_count + 1,
          last_request_at: now.toISOString()
        })
        .eq('id', rateLimit.id);

      return {
        allowed: true,
        remaining: config.maxRequests - (rateLimit.request_count + 1),
        resetAt: new Date(new Date(rateLimit.window_start).getTime() + config.windowMs),
      };
    } else {
      await supabaseClient
        .from('rate_limits')
        .insert({
          ip_address: ipAddress,
          endpoint: config.endpoint,
          request_count: 1,
          window_start: now.toISOString(),
          last_request_at: now.toISOString()
        });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }
  } catch (error) {
    console.error('IP rate limit error:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Standard rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  // AI Analysis endpoints (expensive operations)
  ANALYSIS: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  // Sensitive operations (account deletion, role changes)
  SENSITIVE: {
    windowMs: 300000, // 5 minutes
    maxRequests: 3,
  },
  // Notification sending (spam prevention)
  NOTIFICATION: {
    windowMs: 60000, // 1 minute
    maxRequests: 20,
  },
  // Resource intensive operations (friend suggestions, etc)
  RESOURCE_INTENSIVE: {
    windowMs: 300000, // 5 minutes
    maxRequests: 5,
  },
  // General API endpoints
  GENERAL: {
    windowMs: 60000, // 1 minute
    maxRequests: 30,
  },
  // Anonymous/IP-based (more restrictive)
  ANONYMOUS: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  },
};