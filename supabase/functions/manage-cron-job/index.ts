import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('manage-cron-job');

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.success({ requestId, action: 'request_received' });
    const { action, jobId, jobName, schedule, command } = await req.json();

    // Connect to database using postgres directly
    const sql = postgres(Deno.env.get('SUPABASE_DB_URL') ?? '', {
      max: 1,
    });

    let result;

    switch (action) {
      case 'create':
        if (!jobName || !schedule || !command) {
          throw new Error('Missing required fields: jobName, schedule, command');
        }
        
        await sql`
          SELECT cron.schedule(
            ${jobName},
            ${schedule},
            ${command}
          )
        `;
        
        result = { success: true, message: 'Cron job created successfully' };
        break;

      case 'delete':
        if (!jobId) {
          throw new Error('Missing required field: jobId');
        }
        
        await sql`SELECT cron.unschedule(${jobId})`;
        
        result = { success: true, message: 'Cron job deleted successfully' };
        break;

      case 'update':
        if (!jobId || !schedule) {
          throw new Error('Missing required fields: jobId, schedule');
        }
        
        // Get job details first
        const [job] = await sql`
          SELECT * FROM cron.job WHERE jobid = ${jobId}
        `;
        
        if (!job) {
          throw new Error('Job not found');
        }
        
        // Delete old job
        await sql`SELECT cron.unschedule(${jobId})`;
        
        // Create new job with updated schedule
        await sql`
          SELECT cron.schedule(
            ${job.jobname},
            ${schedule},
            ${job.command}
          )
        `;
        
        result = { success: true, message: 'Cron job updated successfully' };
        break;

      case 'list':
        const jobs = await sql`
          SELECT * FROM cron.job ORDER BY jobid DESC
        `;
        
        result = { jobs };
        break;

      default:
        throw new Error('Invalid action. Must be: create, delete, update, or list');
    }

    await sql.end();

    const duration = performance.now() - startTime;
    logger.performance(duration, true);
    logger.success({ requestId, action: 'request_completed', duration: `${duration.toFixed(2)}ms` });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, { requestId, duration: `${duration.toFixed(2)}ms` });
    logger.performance(duration, false, (error as Error).constructor.name);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
