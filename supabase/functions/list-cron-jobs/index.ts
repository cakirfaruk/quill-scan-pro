import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Execute raw SQL query to list cron jobs
    const { data, error } = await supabaseAdmin.rpc('execute_raw_sql', {
      sql_query: 'SELECT * FROM cron.job ORDER BY jobid DESC'
    });

    if (error) {
      // If function doesn't exist, try direct query
      const directQuery = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({
            query: 'SELECT * FROM cron.job ORDER BY jobid DESC'
          })
        }
      );

      if (!directQuery.ok) {
        throw new Error('Failed to fetch cron jobs');
      }

      const result = await directQuery.json();
      
      return new Response(
        JSON.stringify({ jobs: result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ jobs: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error listing cron jobs:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
