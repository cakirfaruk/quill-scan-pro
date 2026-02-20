import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate input
    const requestSchema = z.object({
      userId: z.string().uuid('Invalid user ID format'),
      analysisType: z.enum(['tarot', 'coffee', 'dream', 'palmistry', 'horoscope', 'birthchart', 'numerology'], {
        errorMap: () => ({ message: 'Invalid analysis type' })
      }),
      title: z.string().min(1).max(200, 'Title too long').trim()
    });

    const validation = requestSchema.safeParse(await req.json());
    
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Geçersiz istek verisi' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { userId, analysisType, title } = validation.data;

    console.log(`Sending notification to user ${userId} for ${analysisType}`);

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
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationMessages: Record<string, { title: string; body: string; url: string }> = {
      tarot: {
        title: '🔮 Tarot Falınız Hazır!',
        body: title,
        url: '/tarot'
      },
      coffee: {
        title: '☕ Kahve Falınız Yorumlandı!',
        body: 'Fincanınızdaki işaretler çözüldü',
        url: '/coffee-fortune'
      },
      dream: {
        title: '🌙 Rüya Tabiriniz Hazır!',
        body: 'Rüyanızın anlamı keşfedildi',
        url: '/dream-interpretation'
      },
      palmistry: {
        title: '🖐️ El Falınız Tamamlandı!',
        body: 'Avuçlarınız analiz edildi',
        url: '/palmistry'
      },
      horoscope: {
        title: '⭐ Günlük Burcunuz Hazır!',
        body: 'Bugün için özel mesajınız var',
        url: '/daily-horoscope'
      },
      birthchart: {
        title: '🌟 Doğum Haritanız Oluşturuldu!',
        body: 'Astrolojik profiliniz hazır',
        url: '/birth-chart'
      },
      numerology: {
        title: '🔢 Numeroloji Analiziniz Hazır!',
        body: 'Sayılarınızın gizemi çözüldü',
        url: '/numerology'
      }
    };

    const notificationData = notificationMessages[analysisType] || {
      title: '✨ Analiziniz Hazır!',
      body: title,
      url: '/'
    };

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          // Generate VAPID token
          const vapidToken = await generateVAPIDToken(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
          
          // Use Web Push API
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400', // 24 hours
              'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
            },
            body: JSON.stringify({
              title: notificationData.title,
              body: notificationData.body,
              message: notificationData.body,
              link: notificationData.url,
              url: notificationData.url,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `analysis-${analysisType}`,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Push notification failed:', response.status, errorText);
            
            // If subscription is invalid, remove it
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', subscription.id);
              console.log('Removed invalid subscription');
            }
            
            throw new Error(`Push failed: ${response.status}`);
          }

          console.log('Push notification sent successfully');
          return { success: true };
        } catch (error) {
          console.error('Error sending to subscription:', error);
          return { success: false, error };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        sent: successCount,
        total: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-analysis-notification function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Helper function to generate VAPID token with proper ES256 signing
async function generateVAPIDToken(audience: string, publicKey: string, privateKey: string): Promise<string> {
  try {
    // Decode the base64url private key
    const privateKeyBytes = Uint8Array.from(
      atob(privateKey.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    // Import the private key for ES256 signing
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );

    // Create the JWT payload
    const payload = {
      aud: new URL(audience).origin,
      exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
      sub: 'mailto:admin@lovable.app'
    };

    // Sign and create the JWT token using djwt
    const jwt = await create(
      { alg: 'ES256', typ: 'JWT' },
      payload,
      cryptoKey
    );

    return jwt;
  } catch (error) {
    console.error('Error generating VAPID token:', error);
    throw new Error('Failed to generate VAPID authentication token');
  }
}
