import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivatePackageRequest {
  package_id: string;
  notification_hour?: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { package_id, notification_hour = 8 }: ActivatePackageRequest = await req.json();

    // Get package details
    const { data: packageData, error: packageError } = await supabaseClient
      .from('time_based_packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Package not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.credits < packageData.credit_cost) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient credits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct credits atomically
    const { data: newCredits, error: deductError } = await supabaseClient
      .rpc('deduct_credits_atomic', {
        p_user_id: user.id,
        p_amount: packageData.credit_cost,
        p_transaction_type: 'package_purchase',
        p_description: `Paket satın alma: ${packageData.name}`
      });

    if (deductError) {
      console.error('Credit deduction error:', deductError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to deduct credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageData.duration_days);

    // Create active package
    const { data: activePackage, error: activateError } = await supabaseClient
      .from('user_active_packages')
      .insert({
        user_id: user.id,
        package_id: packageData.id,
        package_name: packageData.name,
        package_type: packageData.package_type,
        expires_at: expiresAt.toISOString(),
        usage_limit: packageData.usage_limit,
        notification_hour: notification_hour,
        is_active: true
      })
      .select()
      .single();

    if (activateError) {
      console.error('Package activation error:', activateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to activate package' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log purchase
    await supabaseClient
      .from('purchases')
      .insert({
        user_id: user.id,
        purchase_type: 'package',
        item_id: packageData.id,
        item_name: packageData.name,
        amount_paid: packageData.credit_cost,
        currency: 'credits',
        platform: 'web',
        status: 'completed'
      });

    console.log(`Package activated: ${packageData.name} for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        active_package: activePackage,
        remaining_credits: newCredits,
        message: `${packageData.name} paketi başarıyla aktifleştirildi!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Activate package error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
