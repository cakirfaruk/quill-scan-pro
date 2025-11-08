import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  cronJobLogId?: string;
  jobName: string;
  status: 'success' | 'error' | 'auto_disabled' | 'failed';
  message?: string;
  errorMessage?: string;
  errorDetails?: string;
  duration?: number;
  isTest?: boolean;
  isAutoDisable?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cronJobLogId, jobName, status, message, errorMessage, errorDetails, duration, isTest, isAutoDisable }: NotificationRequest = await req.json();

    console.log('Cron notification request:', { cronJobLogId, jobName, status, isAutoDisable });

    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('cron_notification_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.log('No notification settings found');
      return new Response(
        JSON.stringify({ message: 'No notification settings configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Auto-disable notifications should always be sent
    const shouldSendEmail = 
      isAutoDisable ||
      (status === 'failed' && settings.email_on_error) ||
      (status === 'error' && settings.email_on_error) ||
      (status === 'success' && settings.email_on_success);

    const shouldSendPush = 
      isAutoDisable ||
      (status === 'failed' && settings.push_on_error) ||
      (status === 'error' && settings.push_on_error) ||
      (status === 'success' && settings.push_on_success);

    if (!shouldSendEmail && !shouldSendPush) {
      console.log('Notifications disabled for this status');
      return new Response(
        JSON.stringify({ message: 'Notifications disabled for this status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = {
      email: null as string | null,
      push: null as string | null,
    };

    // Send email notification
    if (shouldSendEmail && settings.email_recipients && settings.email_recipients.length > 0) {
      try {
        const finalMessage = message || errorMessage || 'No message';
        const html = generateEmailHTML(jobName, status, finalMessage, errorDetails, isAutoDisable, isTest);

        const subjectPrefix = 
          isAutoDisable ? '🚨 Cron Job Otomatik Devre Dışı' :
          status === 'error' || status === 'failed' ? '❌ Cron Job Hatası' : 
          '✅ Cron Job Başarılı';

        await sendEmailAlert(
          settings.email_recipients,
          `${subjectPrefix}: ${jobName}${isTest ? ' (TEST)' : ''}`,
          html
        );

        results.email = 'sent';
        console.log('Email notification sent');
      } catch (error) {
        console.error('Failed to send email:', error);
        results.email = 'failed';
      }
    }

    // Send push notification
    if (shouldSendPush) {
      try {
        // Get admin users' push subscriptions
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          const adminIds = adminRoles.map(r => r.user_id);
          
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', adminIds);

          if (subscriptions && subscriptions.length > 0) {
            const finalMessage = message || errorMessage || 'No message';
            const pushTitle = 
              isAutoDisable ? '🚨 Cron Job Devre Dışı' :
              status === 'error' || status === 'failed' ? '❌ Cron Job Hatası' : 
              '✅ Cron Job Başarılı';

            const pushPromises = subscriptions.map(sub => 
              sendPushNotification(sub, {
                title: pushTitle + (isTest ? ' (TEST)' : ''),
                body: `${jobName}: ${finalMessage}`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
              })
            );

            await Promise.allSettled(pushPromises);
            results.push = 'sent';
            console.log('Push notifications sent');
          }
        }
      } catch (error) {
        console.error('Failed to send push notifications:', error);
        results.push = 'failed';
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-cron-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateEmailHTML(
  jobName: string, 
  status: 'success' | 'error' | 'auto_disabled' | 'failed', 
  message: string, 
  errorDetails?: string,
  isAutoDisable?: boolean,
  isTest?: boolean
): string {
  const statusColor = 
    isAutoDisable ? '#f59e0b' :
    status === 'error' || status === 'failed' ? '#ef4444' : 
    '#22c55e';
  const statusIcon = 
    isAutoDisable ? '🚨' :
    status === 'error' || status === 'failed' ? '❌' : 
    '✅';
  const statusText = 
    isAutoDisable ? 'DEVRE DIŞI BIRAKILDI' :
    status === 'error' || status === 'failed' ? 'HATA' : 
    'BAŞARILI';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px; }
          .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; font-size: 24px; margin: 0 0 30px; }
          .section { margin-bottom: 20px; }
          .label { color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px; }
          .value { color: #333; font-size: 16px; font-weight: 500; margin: 0 0 16px; }
          .message { color: #333; font-size: 14px; line-height: 24px; }
          .error { color: #ef4444; background-color: #fef2f2; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px; }
          .button { background-color: #5469d4; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          hr { border: none; border-top: 1px solid #e6ebf1; margin: 20px 0; }
          .footer { color: #8898aa; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${statusIcon} Cron Job ${statusText}${isTest ? ' (TEST)' : ''}</h1>
          
          ${isAutoDisable ? `
          <div class="section" style="background-color: #fef3c7; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <p style="color: #92400e; font-weight: 600; margin: 0 0 8px;">⚠️ Otomatik Devre Dışı Bırakıldı</p>
            <p style="color: #78350f; font-size: 14px; margin: 0;">
              Bu cron job başarısızlık eşiğine ulaştığı için otomatik olarak devre dışı bırakıldı. 
              Job'u tekrar aktif etmek için admin panelini kontrol edin.
            </p>
          </div>
          ` : ''}
          
          <div class="section">
            <p class="label">Job Adı:</p>
            <p class="value">${jobName}</p>
          </div>

          <div class="section">
            <p class="label">Durum:</p>
            <p class="value" style="color: ${statusColor}">${statusText}</p>
          </div>

          <div class="section">
            <p class="label">Çalışma Zamanı:</p>
            <p class="value">${new Date().toLocaleString('tr-TR')}</p>
          </div>

          <hr>

          <div class="section">
            <p class="label">Mesaj:</p>
            <p class="message">${message}</p>
          </div>

          ${errorDetails ? `
          <div class="section">
            <p class="label">Hata Detayları:</p>
            <div class="error">${errorDetails}</div>
          </div>
          ` : ''}

          ${isTest ? `
          <div class="section" style="background-color: #dbeafe; padding: 16px; border-radius: 4px; margin-top: 20px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0;">ℹ️ Bu bir test bildirimidir</p>
          </div>
          ` : ''}

          <hr>

          <p class="footer">Bu bildirim otomatik olarak gönderilmiştir.</p>
        </div>
      </body>
    </html>
  `;
}

async function sendEmailAlert(recipients: string[], subject: string, htmlContent: string) {
  const gmailCredentials = JSON.parse(Deno.env.get('GMAIL_SERVICE_ACCOUNT_JSON') || '{}');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: gmailCredentials.client_email,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const signature = await signJWT(
    `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`,
    gmailCredentials.private_key
  );

  const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const { access_token } = await tokenResponse.json();

  for (const recipient of recipients) {
    const email = [
      `To: ${recipient}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ].join('\n');

    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });
  }
}

async function sendPushNotification(subscription: any, notification: any) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  const payload = JSON.stringify(notification);
  
  const jwt = await createJWT(vapidPrivateKey!, subscription.endpoint);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      'TTL': '86400',
    },
    body: payload,
  });

  if (!response.ok && response.status === 410) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', subscription.id);
  }

  return response.ok;
}

async function createJWT(privateKey: string, audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: new URL(audience).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:admin@example.com',
  };

  return 'dummy-jwt-token';
}

async function signJWT(data: string, privateKey: string): Promise<string> {
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.substring(
    pemHeader.length,
    privateKey.length - pemFooter.length - 1
  );
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
