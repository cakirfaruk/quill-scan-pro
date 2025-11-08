import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error managing cron job:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
