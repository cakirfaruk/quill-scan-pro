import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { checkIPRateLimit, getClientIP, RateLimitPresets } from '../_shared/rateLimit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallNotificationRequest {
  receiverId: string;
  callerName: string;
  callerPhoto?: string;
  callType: 'audio' | 'video';
  callId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    console.log('Send call notification function called');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // IP-based rate limiting for call notification spam prevention
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkIPRateLimit(
      supabase,
      clientIP,
      {
        ...RateLimitPresets.NOTIFICATION,
        endpoint: 'send-call-notification',
      }
    );

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Too many call notification requests',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { receiverId, callerName, callerPhoto, callType, callId } = await req.json() as CallNotificationRequest;

    console.log('Sending notification to:', receiverId, 'from:', callerName);

    // Get all push subscriptions for the receiver
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', receiverId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user:', receiverId);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Prepare notification payload
    const notificationPayload = {
      title: `${callerName} Arıyor`,
      body: callType === 'video' ? '📹 Görüntülü arama' : '📞 Sesli arama',
      icon: callerPhoto || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `call-${callId}`,
      data: {
        url: `/messages?callId=${callId}`,
        callId,
        callerId: callerName,
        callType,
      },
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200, 100, 200],
    };

    // Send push notifications to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        // Use web-push library via fetch to web-push.org service
        // Note: In production, you'd use the web-push npm package
        // For now, we'll use the native Notification API approach
        console.log('Sending to endpoint:', subscription.endpoint);

        // Create the encryption headers and payload
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'TTL': '86400', // 24 hours
            'Authorization': `vapid t=${createJWT(vapidPrivateKey, subscription.endpoint)}, k=${vapidPublicKey}`,
          },
          body: JSON.stringify(notificationPayload),
        });

        if (!response.ok) {
          console.error(`Failed to send to ${subscription.endpoint}:`, response.status);
          
          // If subscription is invalid (410 Gone), delete it
          if (response.status === 410) {
            console.log('Deleting invalid subscription');
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
        } else {
          console.log('Push sent successfully to:', subscription.endpoint);
        }

        return response.ok;
      } catch (error) {
        console.error('Error sending push to subscription:', error);
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r).length;

    console.log(`Sent ${successCount}/${subscriptions.length} notifications successfully`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        sent: successCount,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-call-notification function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to create JWT for VAPID
function createJWT(privateKey: string, audience: string): string {
  // Extract the origin from the endpoint
  const url = new URL(audience);
  const aud = `${url.protocol}//${url.host}`;
  
  // Create JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };
  
  // Create JWT payload
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: 'mailto:support@example.com', // Change this to your support email
  };
  
  // Base64 URL encode
  const base64UrlEncode = (obj: any) => {
    const str = JSON.stringify(obj);
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  
  // In a real implementation, you would sign this with the private key
  // For now, returning a placeholder - you'll need to use web-crypto API
  return `${encodedHeader}.${encodedPayload}.placeholder-signature`;
}
