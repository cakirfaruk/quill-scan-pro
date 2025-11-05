import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Yetkisiz erişim' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Yetkisiz erişim' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate user can only test their own notifications
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Sadece kendi bildirimlerinizi test edebilirsiniz' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Sending test push notification to user:', userId);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ error: 'No push subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s)`);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const notificationPayload = {
      title: '🔔 Test Bildirimi',
      message: 'Push bildirimleriniz başarıyla çalışıyor!',
      body: 'Push bildirimleriniz başarıyla çalışıyor!',
      tag: 'test-notification',
      icon: '/favicon.ico',
    };

    let successCount = 0;
    let failCount = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        // Create JWT for VAPID
        const jwt = await createJWT(vapidPrivateKey, pushSubscription.endpoint);

        // Send push notification
        const response = await fetch(pushSubscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
          },
          body: JSON.stringify(notificationPayload),
        });

        if (response.status === 410) {
          console.log('Subscription expired, removing from database');
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
          failCount++;
        } else if (!response.ok) {
          console.error('Push notification failed:', response.status, await response.text());
          failCount++;
        } else {
          console.log('Push notification sent successfully');
          successCount++;
        }
      } catch (error) {
        console.error('Error sending to subscription:', error);
        failCount++;
      }
    }

    console.log(`Test notification results: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        successCount, 
        failCount,
        message: 'Test notification sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-push-notification:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Base64 URL encoding helper
function base64UrlEncode(input: string | Uint8Array): string {
  let base64: string;
  if (typeof input === 'string') {
    base64 = btoa(input);
  } else {
    base64 = btoa(String.fromCharCode(...input));
  }
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to create JWT for VAPID with proper ES256 signing
async function createJWT(privateKeyJwk: string, audience: string): Promise<string> {
  const url = new URL(audience);
  const aud = `${url.protocol}//${url.host}`;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };
  
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: 'mailto:support@example.com',
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  try {
    // Import the private key
    const keyData = JSON.parse(privateKeyJwk);
    const key = await crypto.subtle.importKey(
      'jwk',
      keyData,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );
    
    // Sign the token
    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      key,
      new TextEncoder().encode(unsignedToken)
    );
    
    const encodedSignature = base64UrlEncode(new Uint8Array(signature));
    return `${unsignedToken}.${encodedSignature}`;
  } catch (error) {
    console.error('Error signing JWT:', error);
    // Fallback to unsigned token (will likely fail but won't crash)
    return `${unsignedToken}.unsigned`;
  }
}
