import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('check-alert-escalations');

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

    console.log('Checking for alerts that need escalation...');

    // Get all enabled escalation configurations
    const { data: escalationConfigs, error: configError } = await supabase
      .from('alert_escalations')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      console.error('Error fetching escalation configs:', configError);
      throw configError;
    }

    if (!escalationConfigs || escalationConfigs.length === 0) {
      console.log('No active escalation configurations found');
      return new Response(
        JSON.stringify({ success: true, message: 'No escalations configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let escalationsTriggered = 0;

    for (const config of escalationConfigs) {
      // Get unacknowledged alerts matching this escalation config
      const { data: alerts, error: alertsError } = await supabase
        .from('alert_logs')
        .select('*')
        .eq('acknowledged', false)
        .in('severity', config.severity_levels);

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
        continue;
      }

      if (!alerts || alerts.length === 0) continue;

      for (const alert of alerts) {
        // Check if alert type matches (if specified)
        if (config.alert_types && config.alert_types.length > 0) {
          if (!config.alert_types.includes(alert.type)) continue;
        }

        // Calculate time since alert was sent
        const alertTime = new Date(alert.sent_at);
        const now = new Date();
        const minutesSinceAlert = (now.getTime() - alertTime.getTime()) / (1000 * 60);

        // Check if alert is old enough for escalation
        if (minutesSinceAlert < config.escalation_delay_minutes) continue;

        // Check how many escalations have been sent for this alert
        const { data: existingEscalations, error: escalationError } = await supabase
          .from('escalation_logs')
          .select('escalation_level')
          .eq('alert_log_id', alert.id)
          .order('escalation_level', { ascending: false })
          .limit(1);

        if (escalationError) {
          console.error('Error fetching escalation logs:', escalationError);
          continue;
        }

        const currentLevel = existingEscalations && existingEscalations.length > 0
          ? existingEscalations[0].escalation_level
          : 0;

        const escalationLevels = config.escalation_levels as any[];
        const nextLevel = currentLevel + 1;

        // Check if there's a next escalation level
        if (nextLevel > escalationLevels.length) continue;

        const levelConfig = escalationLevels[nextLevel - 1];

        // Check if enough time has passed for this escalation level
        if (existingEscalations && existingEscalations.length > 0) {
          const { data: lastEscalation } = await supabase
            .from('escalation_logs')
            .select('sent_at')
            .eq('alert_log_id', alert.id)
            .eq('escalation_level', currentLevel)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          if (lastEscalation) {
            const lastEscalationTime = new Date(lastEscalation.sent_at);
            const minutesSinceLastEscalation = (now.getTime() - lastEscalationTime.getTime()) / (1000 * 60);
            
            if (minutesSinceLastEscalation < config.escalation_delay_minutes) continue;
          }
        }

        // Send escalation
        console.log(`Triggering escalation level ${nextLevel} for alert ${alert.id}`);

        try {
          // Send the alert using send-alert function
          const { error: sendError } = await supabase.functions.invoke('send-alert', {
            body: {
              type: alert.type,
              severity: alert.severity,
              message: `[ESCALATION LEVEL ${nextLevel}] ${alert.message}`,
              details: {
                ...alert.details,
                escalationLevel: nextLevel,
                originalAlertTime: alert.sent_at,
              },
            },
          });

          if (sendError) {
            console.error('Error sending escalation alert:', sendError);
            continue;
          }

          // Log the escalation
          await supabase.from('escalation_logs').insert({
            alert_log_id: alert.id,
            escalation_level: nextLevel,
            escalation_config_id: config.id,
            notification_type: levelConfig.type || 'email',
            recipients: levelConfig.recipients || [],
          });

          escalationsTriggered++;
        } catch (error) {
          console.error('Error processing escalation:', error);
        }
      }
    }

    console.log(`Escalation check complete. Triggered ${escalationsTriggered} escalations.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        escalationsTriggered,
        message: `Checked and triggered ${escalationsTriggered} escalations`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, { requestId, duration: `${duration.toFixed(2)}ms` });
    logger.performance(duration, false, (error as Error).constructor.name);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
