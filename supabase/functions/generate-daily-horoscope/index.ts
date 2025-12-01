import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const logger = createLogger('generate-daily-horoscope');

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.success({ requestId, action: 'request_received' });
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header gerekli' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      await logger.error('Authentication failed', { requestId, error: userError });
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.success({ requestId, action: 'user_authenticated', userId: user.id });

    // Get user profile for birth info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits, birth_date, full_name')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 10) {
      await logger.warning('Insufficient credits', { requestId, userId: user.id, available: profile?.credits });
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    logger.success({ requestId, action: 'credits_verified', userId: user.id });

    // Check if already got horoscope today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingHoroscope } = await supabaseClient
      .from('daily_horoscopes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .maybeSingle();

    if (existingHoroscope) {
      return new Response(JSON.stringify({ 
        interpretation: existingHoroscope.horoscope_text,
        readingId: existingHoroscope.id,
        alreadyExists: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentDate = new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });

    const prompt = `Bugün ${currentDate}. 
${profile.full_name ? `İsim: ${profile.full_name}` : ''}
${profile.birth_date ? `Doğum tarihi: ${profile.birth_date}` : ''}

Bugün için kişisel bir günlük kehanet/burç yorumu oluştur. Türkçe olarak:

1. Genel Enerji (bugünün genel havası)
2. Aşk ve İlişkiler
3. Kariyer ve İş
4. Para
5. Sağlık
6. Şanslı Sayı ve Renk
7. Tavsiye

Pozitif, motive edici ve rehberlik edici ol.

JSON formatında şu yapıda cevap ver:
{
  "general": "Genel enerji",
  "love": "Aşk",
  "career": "Kariyer",
  "money": "Para",
  "health": "Sağlık",
  "lucky_number": 7,
  "lucky_color": "Mavi",
  "advice": "Günün tavsiyesi"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Sen astroloji ve kehanet uzmanısın. Kişiselleştirilmiş günlük yorumlar yaparsın. TAMAMEN TÜRKÇE yanıt verirsin, hiçbir İngilizce kelime kullanmazsın.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data).slice(0, 200));

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.error('AI API error:', data);
      throw new Error(data.error?.message || 'AI API hatası');
    }

    let interpretation;
    const content = data.choices[0].message.content;
    
    try {
      // Try to extract JSON from markdown code blocks
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      interpretation = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, try direct parse
      try {
        interpretation = JSON.parse(content);
      } catch {
        // If still fails, wrap in raw
        interpretation = { raw: content };
      }
    }

    // Deduct credits
    await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 10 })
      .eq('user_id', user.id);

    // Save horoscope
    const { data: reading, error: saveError } = await supabaseClient
      .from('daily_horoscopes')
      .insert({
        user_id: user.id,
        horoscope_text: interpretation,
        credits_used: 10
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Record transaction
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -10,
        transaction_type: 'deduction',
        description: 'Günlük kehanet',
        reference_id: reading.id
      });

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, { requestId, duration: `${duration.toFixed(2)}ms` });
    logger.performance(duration, false, (error as Error).constructor.name);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});