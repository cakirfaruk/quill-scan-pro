import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Manually triggering cron job:', jobId);

    // Get the cron job details from pg_cron
    const { data: jobs, error: listError } = await supabase.rpc('cron.job_cache_invalidate');
    
    if (listError) {
      console.error('Error invalidating cache:', listError);
    }

    // Get job details using a raw query
    const { data: jobDetails, error: jobError } = await supabase
      .from('cron.job')
      .select('*')
      .eq('jobid', jobId)
      .single();

    if (jobError) {
      console.error('Error fetching job details:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found: ' + jobError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Job details:', jobDetails);

    // Extract the edge function URL from the command
    const command = jobDetails.command;
    const urlMatch = command.match(/url:='([^']+)'/);
    const headersMatch = command.match(/headers:='([^']+)'/);
    const bodyMatch = command.match(/body:=concat\('([^']+)'/);

    if (!urlMatch) {
      return new Response(
        JSON.stringify({ error: 'Could not parse edge function URL from command' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const edgeFunctionUrl = urlMatch[1];
    let headers: Record<string, string> = {};
    
    if (headersMatch) {
      try {
        headers = JSON.parse(headersMatch[1]);
      } catch (e) {
        console.error('Error parsing headers:', e);
      }
    }

    // Create a log entry for manual trigger
    const startedAt = new Date().toISOString();
    const { data: logEntry, error: logError } = await supabase
      .from('cron_job_logs')
      .insert({
        job_id: jobId,
        job_name: jobDetails.jobname,
        status: 'running',
        started_at: startedAt,
        details: { manual_trigger: true }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating log entry:', logError);
    }

    // Call the edge function
    console.log('Calling edge function:', edgeFunctionUrl);
    
    const functionResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ time: new Date().toISOString(), manual_trigger: true }),
    });

    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    // Update log with result
    if (logEntry) {
      const success = functionResponse.ok;
      const errorMessage = success ? null : `HTTP ${functionResponse.status}: ${functionResponse.statusText}`;
      
      await supabase
        .from('cron_job_logs')
        .update({
          status: success ? 'success' : 'failed',
          completed_at: completedAt,
          duration_ms: duration,
          error_message: errorMessage,
        })
        .eq('id', logEntry.id);

      console.log(`Job execution ${success ? 'succeeded' : 'failed'}. Duration: ${duration}ms`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Job triggered successfully',
        jobName: jobDetails.jobname,
        duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in trigger-cron-job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});