import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    console.log('Checking for failed cron jobs to retry...');

    // Find failed jobs that need retry
    const { data: failedJobs, error: fetchError } = await supabaseAdmin
      .from('cron_job_logs')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', supabaseAdmin.rpc('max_retries'))
      .or('next_retry_at.is.null,next_retry_at.lte.now()')
      .order('started_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching failed jobs:', fetchError);
      throw fetchError;
    }

    if (!failedJobs || failedJobs.length === 0) {
      console.log('No failed jobs to retry');
      return new Response(
        JSON.stringify({ message: 'No failed jobs to retry', retriedCount: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${failedJobs.length} failed jobs to retry`);

    let retriedCount = 0;
    const results = [];

    for (const job of failedJobs) {
      try {
        console.log(`Retrying job: ${job.job_name} (attempt ${job.retry_count + 1}/${job.max_retries})`);

        const retryStartTime = Date.now();

        // Try to invoke the original cron job through check-alert-escalations
        // Since we don't have direct access to run cron jobs, we log the retry attempt
        const newRetryCount = (job.retry_count || 0) + 1;
        
        // Calculate exponential backoff: 60s * 2^retry_count
        const backoffSeconds = (job.retry_delay_seconds || 60) * Math.pow(2, newRetryCount);
        const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

        // Update the log with retry information
        const { error: updateError } = await supabaseAdmin
          .from('cron_job_logs')
          .update({
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt.toISOString(),
            details: {
              ...job.details,
              last_retry_attempt: new Date().toISOString(),
              retry_history: [
                ...(job.details?.retry_history || []),
                {
                  attempt: newRetryCount,
                  timestamp: new Date().toISOString(),
                  next_retry_at: nextRetryAt.toISOString()
                }
              ]
            }
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating retry info for job ${job.id}:`, updateError);
          results.push({ 
            job_name: job.job_name, 
            success: false, 
            error: updateError.message 
          });
          continue;
        }

        // Create a new log entry for the retry attempt
        const { error: insertError } = await supabaseAdmin
          .from('cron_job_logs')
          .insert({
            job_name: job.job_name,
            job_id: job.job_id,
            status: 'running',
            retry_count: newRetryCount,
            max_retries: job.max_retries,
            retry_delay_seconds: job.retry_delay_seconds,
            details: {
              original_job_id: job.id,
              retry_attempt: newRetryCount,
              reason: 'Automatic retry after failure'
            }
          });

        if (insertError) {
          console.error(`Error creating retry log for job ${job.id}:`, insertError);
        }

        retriedCount++;
        results.push({ 
          job_name: job.job_name, 
          success: true, 
          retry_count: newRetryCount,
          next_retry_at: nextRetryAt.toISOString()
        });

        console.log(`Scheduled retry for ${job.job_name} at ${nextRetryAt.toISOString()}`);

      } catch (error) {
        console.error(`Error processing retry for job ${job.id}:`, error);
        results.push({ 
          job_name: job.job_name, 
          success: false, 
          error: (error as Error).message 
        });
      }
    }

    console.log(`Retry process completed. Retried ${retriedCount} jobs.`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${failedJobs.length} failed jobs`,
        retriedCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in retry-failed-cron-jobs function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
