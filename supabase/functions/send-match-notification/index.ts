import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { checkIPRateLimit, getClientIP, RateLimitPresets } from '../_shared/rateLimit.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('send-match-notification');

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.success({ requestId, action: 'request_received' });
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
      await logger.warning('Missing required fields', { requestId, user1_id, user2_id, match_id });
      throw new Error('Missing required fields');
    }

    logger.success({ requestId, action: 'match_data_validated', match_id });

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
      await logger.error('User profiles not found', { requestId, user1_id, user2_id });
      throw new Error('User profiles not found');
    }

    logger.success({ 
      requestId, 
      action: 'profiles_fetched',
      user1: user1Profile.data.username,
      user2: user2Profile.data.username
    });

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
      await logger.error('Error creating notifications', { 
        requestId, 
        match_id, 
        error: notifError 
      });
      throw notifError;
    }

    logger.success({ requestId, action: 'notifications_created', count: notifications.length });

    // Get push subscriptions for both users
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', [user1_id, user2_id]);

    // Send push notifications
    if (subscriptions && subscriptions.length > 0) {
      logger.success({ requestId, action: 'sending_push_notifications', count: subscriptions.length });
      
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
          logger.success({ requestId, action: 'push_sent', userId: sub.user_id });
          
          // You can integrate with web-push or similar service here
          // For now, just log it
        } catch (error) {
          await logger.error('Failed to send push notification', { 
            requestId, 
            userId: sub.user_id,
            error 
          });
        }
      });

      await Promise.allSettled(pushPromises);
    }

    const duration = performance.now() - startTime;
    logger.performance(duration, true);
    logger.success({ 
      requestId, 
      action: 'request_completed',
      duration: `${duration.toFixed(2)}ms` 
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Match notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
      stack: (error as Error).stack
    });
    logger.performance(duration, false, (error as Error).constructor.name);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
