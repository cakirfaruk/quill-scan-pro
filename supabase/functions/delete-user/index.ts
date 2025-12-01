import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'
import { checkRateLimit, RateLimitPresets } from '../_shared/rateLimit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Rate limiting - sensitive operation
    const rateLimitResult = await checkRateLimit(
      supabaseClient,
      user.id,
      {
        ...RateLimitPresets.SENSITIVE,
        endpoint: 'delete-user',
      }
    )

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        }
      })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is deleting their own account OR is an admin
    const isOwnAccount = user.id === userId
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
    const isAdmin = !!userRole

    if (!isOwnAccount && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You can only delete your own account' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Starting cascade deletion for user: ${userId}`)

    // Create admin client for cascade deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cascade delete all user data (order matters due to foreign keys)
    const deletions = [
      // Analysis history
      supabaseAdmin.from('analysis_history').delete().eq('user_id', userId),
      supabaseAdmin.from('birth_chart_analyses').delete().eq('user_id', userId),
      supabaseAdmin.from('coffee_fortune_readings').delete().eq('user_id', userId),
      supabaseAdmin.from('compatibility_analyses').delete().eq('user_id', userId),
      supabaseAdmin.from('daily_horoscopes').delete().eq('user_id', userId),
      supabaseAdmin.from('dream_interpretations').delete().eq('user_id', userId),
      supabaseAdmin.from('numerology_analyses').delete().eq('user_id', userId),
      supabaseAdmin.from('palmistry_readings').delete().eq('user_id', userId),
      supabaseAdmin.from('tarot_readings').delete().eq('user_id', userId),
      
      // Social content
      supabaseAdmin.from('post_shares').delete().eq('user_id', userId),
      supabaseAdmin.from('post_comments').delete().eq('user_id', userId),
      supabaseAdmin.from('post_likes').delete().eq('user_id', userId),
      supabaseAdmin.from('posts').delete().eq('user_id', userId),
      supabaseAdmin.from('stories').delete().eq('user_id', userId),
      supabaseAdmin.from('reels').delete().eq('user_id', userId),
      
      // Messages
      supabaseAdmin.from('messages').delete().eq('sender_id', userId),
      supabaseAdmin.from('messages').delete().eq('receiver_id', userId),
      supabaseAdmin.from('scheduled_messages').delete().eq('sender_id', userId),
      
      // Social connections
      supabaseAdmin.from('friends').delete().eq('user_id', userId),
      supabaseAdmin.from('friends').delete().eq('friend_id', userId),
      supabaseAdmin.from('blocked_users').delete().eq('user_id', userId),
      supabaseAdmin.from('blocked_users').delete().eq('blocked_user_id', userId),
      
      // Matching
      supabaseAdmin.from('swipes').delete().eq('user_id', userId),
      supabaseAdmin.from('swipes').delete().eq('target_user_id', userId),
      supabaseAdmin.from('matches').delete().eq('user1_id', userId),
      supabaseAdmin.from('matches').delete().eq('user2_id', userId),
      
      // Notifications
      supabaseAdmin.from('notifications').delete().eq('user_id', userId),
      
      // Gamification
      supabaseAdmin.from('user_badges').delete().eq('user_id', userId),
      supabaseAdmin.from('mission_completions').delete().eq('user_id', userId),
      supabaseAdmin.from('user_mission_progress').delete().eq('user_id', userId),
      supabaseAdmin.from('user_weekly_progress').delete().eq('user_id', userId),
      
      // Transactions
      supabaseAdmin.from('credit_transactions').delete().eq('user_id', userId),
      
      // Sessions and tracking
      supabaseAdmin.from('user_sessions').delete().eq('user_id', userId),
      
      // Finally, delete profile
      supabaseAdmin.from('profiles').delete().eq('user_id', userId),
    ]

    // Execute all deletions
    const results = await Promise.allSettled(deletions)
    
    // Log any deletion errors (but don't fail the entire process)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Deletion ${index} failed:`, result.reason)
      }
    })

    console.log('Cascade deletion completed, deleting auth user')

    // Delete user from auth (this will cascade delete user_roles automatically)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Auth deletion error:', deleteError)
      throw deleteError
    }

    console.log(`User ${userId} successfully deleted`)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Hesabınız ve tüm verileriniz başarıyla silindi'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return new Response(JSON.stringify({ 
      error: 'Kullanıcı silinirken hata oluştu',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
