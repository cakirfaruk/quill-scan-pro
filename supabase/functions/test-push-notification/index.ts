import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createLogger } from '../_shared/logger.ts';

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

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
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
        const jwt = createJWT(vapidPrivateKey, pushSubscription.endpoint);

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

// Helper function to create JWT for VAPID
function createJWT(privateKey: string, audience: string): string {
  // This is a simplified version. In production, you should use a proper JWT library
  // For now, we'll return a placeholder
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = btoa(JSON.stringify({
    aud: new URL(audience).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: 'mailto:admin@example.com'
  }));
  
  // Note: This is a placeholder signature. In production, you need to properly sign this with the private key
  const signature = 'placeholder-signature';
  
  return `${header}.${payload}.${signature}`;
}
