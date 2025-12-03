import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { createLogger } from '../_shared/logger.ts';

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

const logger = createLogger('auto-scale-cron-jobs');

Deno.serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (!expectedSecret || cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    logger.success({ requestId, action: 'request_received' });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.success({ requestId, action: 'starting_auto_scale_check' });

    // Get all jobs with auto-scaling enabled
    const { data: jobs, error: jobsError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('auto_scale_enabled', true)
      .eq('enabled', true);

    if (jobsError) {
      await logger.error('Error fetching jobs', { requestId, error: jobsError });
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      logger.success({ requestId, action: 'no_jobs_found' });
      return new Response(
        JSON.stringify({ message: 'No jobs with auto-scaling enabled', scaled: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scaledJobs = [];

    for (const job of jobs as CronJob[]) {
      logger.success({ requestId, action: 'checking_job', jobName: job.name });

      // Get last 20 executions for this job
      const { data: logs, error: logsError } = await supabase
        .from('cron_job_logs')
        .select('status')
        .eq('job_name', job.name)
        .order('started_at', { ascending: false })
        .limit(20);

      if (logsError) {
        await logger.error(`Error fetching logs for ${job.name}`, { requestId, jobName: job.name, error: logsError });
        continue;
      }

      if (!logs || logs.length < 5) {
        logger.success({ requestId, action: 'insufficient_data', jobName: job.name, logCount: logs?.length || 0 });
        continue;
      }

      // Calculate success rate
      const successCount = (logs as CronJobLog[]).filter(log => log.status === 'success').length;
      const successRate = (successCount / logs.length) * 100;

      logger.success({ requestId, action: 'calculated_success_rate', jobName: job.name, successRate: successRate.toFixed(2), successCount, totalLogs: logs.length });

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
        logger.success({ requestId, action: 'scaling_job', jobName: job.name, oldInterval: job.current_interval_seconds, newInterval });

        // Convert interval to cron schedule
        const cronSchedule = intervalToCron(newInterval);

        // Update pg_cron schedule
        const { error: cronError } = await supabase.rpc('cron.alter_job', {
          job_id: job.id,
          schedule: cronSchedule
        }).single();

        if (cronError) {
          await logger.error(`Error updating pg_cron for ${job.name}`, { requestId, jobName: job.name, error: cronError });
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
          await logger.error(`Error updating job ${job.name}`, { requestId, jobName: job.name, error: updateError });
          continue;
        }
        
        logger.success({ requestId, action: 'job_scaled', jobName: job.name, newInterval, successRate: successRate.toFixed(2) });

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

    const duration = performance.now() - startTime;
    logger.performance(duration, true);
    logger.success({ 
      requestId, 
      action: 'auto_scaling_completed',
      scaledCount: scaledJobs.length,
      totalChecked: jobs.length,
      duration: `${duration.toFixed(2)}ms` 
    });

    return new Response(
      JSON.stringify({
        message: 'Auto-scaling completed',
        scaled: scaledJobs,
        total_jobs_checked: jobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, {
      requestId,
      duration: `${duration.toFixed(2)}ms`
    });
    logger.performance(duration, false, (error as Error).constructor.name);
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
