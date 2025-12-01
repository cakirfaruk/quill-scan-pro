# Shared Utilities for Edge Functions

This directory contains shared utility functions used across multiple edge functions.

## Rate Limiting (`rateLimit.ts`)

Provides database-backed rate limiting to prevent abuse and ensure fair usage.

### Features

- **User-based rate limiting**: Tracks requests per user ID
- **IP-based rate limiting**: Tracks requests per IP address (for unauthenticated endpoints)
- **Flexible configuration**: Different presets for different endpoint types
- **Database persistence**: Uses `rate_limits` table for distributed rate limiting
- **Automatic cleanup**: Old rate limit records are automatically cleaned up

### Usage

```typescript
import { checkRateLimit, RateLimitPresets } from '../_shared/rateLimit.ts'

// For authenticated endpoints
const rateLimitResult = await checkRateLimit(
  supabaseClient,
  userId,
  {
    ...RateLimitPresets.ANALYSIS,
    endpoint: 'analyze-tarot',
  }
)

if (!rateLimitResult.allowed) {
  return new Response(JSON.stringify({ 
    error: 'Rate limit exceeded',
    resetAt: rateLimitResult.resetAt
  }), {
    status: 429,
    headers: { 
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
    }
  })
}

// For IP-based rate limiting (unauthenticated or internal endpoints)
import { checkIPRateLimit, getClientIP } from '../_shared/rateLimit.ts'

const clientIP = getClientIP(req);
const rateLimitResult = await checkIPRateLimit(
  supabaseClient,
  clientIP,
  {
    ...RateLimitPresets.NOTIFICATION,
    endpoint: 'send-notification',
  }
)
```

### Rate Limit Presets

- **ANALYSIS**: AI analysis endpoints (10 requests/minute)
- **SENSITIVE**: Sensitive operations like account deletion (3 requests/5 minutes)
- **NOTIFICATION**: Notification sending (20 requests/minute)
- **RESOURCE_INTENSIVE**: Resource-heavy operations (5 requests/5 minutes)
- **GENERAL**: General API endpoints (30 requests/minute)
- **ANONYMOUS**: IP-based anonymous access (5 requests/minute)

### Response Headers

When rate limit is exceeded, the following headers are included:

- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: ISO timestamp when the rate limit resets

### Database Schema

Requires a `rate_limits` table with the following structure:

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  last_request_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint, window_start);
CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint, window_start);
```

## Best Practices

1. **Choose appropriate presets**: Use stricter limits for expensive operations
2. **Always handle rate limit errors**: Return proper HTTP 429 status codes
3. **Include reset information**: Help clients know when they can retry
4. **Log rate limit violations**: Monitor for potential abuse patterns
5. **Test rate limits**: Ensure they work correctly in your development environment