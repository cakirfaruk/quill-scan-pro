import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, severity, message, details }: AlertRequest = await req.json();

    console.log('Processing alert:', { type, severity, message });

    // Check if alert type is snoozed
    const { data: isSnoozed } = await supabase
      .rpc('is_alert_snoozed', {
        p_alert_type: type,
        p_alert_config_id: null
      });

    if (isSnoozed) {
      console.log(`Alert type ${type} is snoozed, skipping...`);
      return new Response(
        JSON.stringify({ success: true, message: 'Alert is snoozed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active alert configurations
    const { data: configs, error: configError } = await supabase
      .from('alert_configurations')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      console.error('Error fetching alert configs:', configError);
      throw configError;
    }

    if (!configs || configs.length === 0) {
      console.log('No active alert configurations found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active alerts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter configs based on conditions
    const matchingConfigs = configs.filter(config => {
      const conditions = config.conditions as any;
      
      // Check severity threshold
      if (conditions.minSeverity) {
        const severityLevels: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        const alertLevel = severityLevels[severity];
        const minLevel = severityLevels[conditions.minSeverity as string];
        if (alertLevel < minLevel) return false;
      }

      // Check alert types
      if (conditions.types && conditions.types.length > 0) {
        if (!conditions.types.includes(type)) return false;
      }

      return true;
    });

    console.log(`Found ${matchingConfigs.length} matching alert configurations`);

    // Send alerts
    for (const config of matchingConfigs) {
      try {
        // Check if this specific config is snoozed
        const { data: isConfigSnoozed } = await supabase
          .rpc('is_alert_snoozed', {
            p_alert_type: null,
            p_alert_config_id: config.id
          });

        if (isConfigSnoozed) {
          console.log(`Alert config ${config.name} is snoozed, skipping...`);
          continue;
        }

        if (config.type === 'email') {
          await sendEmailAlert(config, { type, severity, message, details });
        } else if (config.type === 'slack' && config.slack_webhook_url) {
          await sendSlackAlert(config.slack_webhook_url, { type, severity, message, details });
        }

        // Log the alert
        await supabase.from('alert_logs').insert({
          alert_config_id: config.id,
          type,
          severity,
          message,
          details,
        });

        console.log(`Alert sent via ${config.type}:`, config.name);
      } catch (error) {
        console.error(`Error sending alert via ${config.type}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alertsSent: matchingConfigs.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-alert function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmailAlert(
  config: any,
  alert: { type: string; severity: string; message: string; details?: any }
) {
  const serviceAccountJson = Deno.env.get('GMAIL_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GMAIL_SERVICE_ACCOUNT_JSON not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Get OAuth2 access token
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  
  const jwtClaim = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  // Sign JWT (simplified - in production use proper JWT library)
  const jwtSignature = await signJWT(`${jwtHeader}.${jwtClaim}`, serviceAccount.private_key);
  const jwt = `${jwtHeader}.${jwtClaim}.${jwtSignature}`;

  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Prepare email content
  const severityEmoji: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };

  const emoji = severityEmoji[alert.severity] || '⚠️';

  const emailContent = [
    'From: ' + serviceAccount.client_email,
    'To: ' + config.recipients.join(','),
    'Subject: ' + `${emoji} Alert: ${alert.type}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    '<html><body>',
    `<h2>${emoji} ${alert.type.toUpperCase()} Alert</h2>`,
    `<p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>`,
    `<p><strong>Message:</strong> ${alert.message}</p>`,
    alert.details ? `<p><strong>Details:</strong> <pre>${JSON.stringify(alert.details, null, 2)}</pre></p>` : '',
    `<p><small>Sent at: ${new Date().toISOString()}</small></p>`,
    '</body></html>',
  ].join('\n');

  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Send email via Gmail API
  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!sendResponse.ok) {
    const error = await sendResponse.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  console.log('Email alert sent successfully');
}

async function sendSlackAlert(
  webhookUrl: string,
  alert: { type: string; severity: string; message: string; details?: any }
) {
  const severityColor: Record<string, string> = {
    low: '#36a64f',
    medium: '#ff9900',
    high: '#ff6600',
    critical: '#ff0000',
  };

  const color = severityColor[alert.severity] || '#999999';

  const slackMessage = {
    attachments: [
      {
        color,
        title: `${alert.type.toUpperCase()} Alert`,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Time',
            value: new Date().toISOString(),
            short: true,
          },
          {
            title: 'Message',
            value: alert.message,
            short: false,
          },
        ],
        footer: 'Astro Social Alert System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage),
  });

  if (!response.ok) {
    throw new Error(`Failed to send Slack alert: ${response.statusText}`);
  }

  console.log('Slack alert sent successfully');
}

async function signJWT(data: string, privateKey: string): Promise<string> {
  // Import the private key
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.substring(
    pemHeader.length,
    privateKey.length - pemFooter.length
  ).replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the data
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(data)
  );

  // Convert to base64url
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
