import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { checkIPRateLimit, getClientIP, RateLimitPresets } from '../_shared/rateLimit.ts'

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // IP-based rate limiting for notification spam prevention
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkIPRateLimit(
      supabase,
      clientIP,
      {
        ...RateLimitPresets.NOTIFICATION,
        endpoint: 'send-match-notification',
      }
    );

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Too many notification requests',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user1_id, user2_id, match_id } = await req.json();

    if (!user1_id || !user2_id || !match_id) {
      throw new Error('Missing required fields');
    }

    console.log(`Sending match notifications for match: ${match_id}`);

    // Get both user profiles
    const [user1Profile, user2Profile] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, full_name')
        .eq('user_id', user1_id)
        .single(),
      supabase
        .from('profiles')
        .select('username, full_name')
        .eq('user_id', user2_id)
        .single(),
    ]);

    if (!user1Profile.data || !user2Profile.data) {
      throw new Error('User profiles not found');
    }

    // Create notifications for both users
    const notifications = [
      {
        user_id: user1_id,
        type: 'match',
        title: '💕 Yeni Eşleşme!',
        message: `${user2Profile.data.full_name || user2Profile.data.username} ile eşleştiniz!`,
        link: `/match?userId=${user2_id}`,
        reference_id: match_id,
      },
      {
        user_id: user2_id,
        type: 'match',
        title: '💕 Yeni Eşleşme!',
        message: `${user1Profile.data.full_name || user1Profile.data.username} ile eşleştiniz!`,
        link: `/match?userId=${user1_id}`,
        reference_id: match_id,
      },
    ];

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      throw notifError;
    }

    // Get push subscriptions for both users
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', [user1_id, user2_id]);

    // Send push notifications
    if (subscriptions && subscriptions.length > 0) {
      const pushPromises = subscriptions.map(async (sub) => {
        const otherUserId = sub.user_id === user1_id ? user2_id : user1_id;
        const otherUserProfile = sub.user_id === user1_id ? user2Profile.data : user1Profile.data;
        
        try {
          const pushPayload = {
            title: '💕 Yeni Eşleşme!',
            body: `${otherUserProfile.full_name || otherUserProfile.username} ile eşleştiniz!`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: {
              url: `/match?userId=${otherUserId}`,
              matchId: match_id,
            },
          };

          // Send push notification (implementation depends on your push service)
          console.log(`Sending push to user ${sub.user_id}:`, pushPayload);
          
          // You can integrate with web-push or similar service here
          // For now, just log it
        } catch (error) {
          console.error(`Failed to send push to user ${sub.user_id}:`, error);
        }
      });

      await Promise.allSettled(pushPromises);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Match notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-match-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
