import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CronJob {
  id: number;
  name: string;
  schedule: string;
  function_name: string;
  auto_scale_enabled: boolean;
  min_interval_seconds: number;
  max_interval_seconds: number;
  current_interval_seconds: number;
  success_rate_threshold_high: number;
  success_rate_threshold_low: number;
}

interface CronJobLog {
  status: 'success' | 'failed' | 'running';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting auto-scale check for cron jobs...');

    // Get all jobs with auto-scaling enabled
    const { data: jobs, error: jobsError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('auto_scale_enabled', true)
      .eq('enabled', true);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs with auto-scaling enabled');
      return new Response(
        JSON.stringify({ message: 'No jobs with auto-scaling enabled', scaled: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scaledJobs = [];

    for (const job of jobs as CronJob[]) {
      console.log(`Checking job: ${job.name}`);

      // Get last 20 executions for this job
      const { data: logs, error: logsError } = await supabase
        .from('cron_job_logs')
        .select('status')
        .eq('job_name', job.name)
        .order('started_at', { ascending: false })
        .limit(20);

      if (logsError) {
        console.error(`Error fetching logs for ${job.name}:`, logsError);
        continue;
      }

      if (!logs || logs.length < 5) {
        console.log(`Not enough data for ${job.name} (${logs?.length || 0} logs)`);
        continue;
      }

      // Calculate success rate
      const successCount = (logs as CronJobLog[]).filter(log => log.status === 'success').length;
      const successRate = (successCount / logs.length) * 100;

      console.log(`Job ${job.name}: ${successRate.toFixed(2)}% success rate (${successCount}/${logs.length})`);

      let newInterval = job.current_interval_seconds;
      let action = 'no_change';

      // High success rate - decrease interval (run more frequently)
      if (successRate >= job.success_rate_threshold_high) {
        const decreaseFactor = 0.8; // Decrease by 20%
        newInterval = Math.max(
          job.min_interval_seconds,
          Math.floor(job.current_interval_seconds * decreaseFactor)
        );
        action = 'increased_frequency';
      }
      // Low success rate - increase interval (run less frequently)
      else if (successRate <= job.success_rate_threshold_low) {
        const increaseFactor = 1.5; // Increase by 50%
        newInterval = Math.min(
          job.max_interval_seconds,
          Math.floor(job.current_interval_seconds * increaseFactor)
        );
        action = 'decreased_frequency';
      }

      // Update if interval changed
      if (newInterval !== job.current_interval_seconds) {
        console.log(`Scaling ${job.name}: ${job.current_interval_seconds}s -> ${newInterval}s`);

        // Convert interval to cron schedule
        const cronSchedule = intervalToCron(newInterval);

        // Update pg_cron schedule
        const { error: cronError } = await supabase.rpc('cron.alter_job', {
          job_id: job.id,
          schedule: cronSchedule
        }).single();

        if (cronError) {
          console.error(`Error updating pg_cron for ${job.name}:`, cronError);
          // Continue anyway and update our table
        }

        // Update our table
        const { error: updateError } = await supabase
          .from('cron_jobs')
          .update({
            current_interval_seconds: newInterval,
            schedule: cronSchedule,
            last_scale_check_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating job ${job.name}:`, updateError);
          continue;
        }

        scaledJobs.push({
          job_name: job.name,
          old_interval: job.current_interval_seconds,
          new_interval: newInterval,
          success_rate: successRate.toFixed(2),
          action
        });
      } else {
        // Just update last check time
        await supabase
          .from('cron_jobs')
          .update({ last_scale_check_at: new Date().toISOString() })
          .eq('id', job.id);
      }
    }

    console.log(`Auto-scaling complete. Scaled ${scaledJobs.length} jobs.`);

    return new Response(
      JSON.stringify({
        message: 'Auto-scaling completed',
        scaled: scaledJobs,
        total_jobs_checked: jobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-scale-cron-jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Convert interval in seconds to cron schedule
function intervalToCron(seconds: number): string {
  if (seconds < 60) {
    // Every N seconds (not standard cron, but some systems support it)
    return `*/${seconds} * * * * *`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `*/${minutes} * * * *`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `0 */${hours} * * *`;
  }
}
