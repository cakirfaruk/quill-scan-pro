import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

// Input validation schema
const dreamSchema = z.object({
  dreamDescription: z.string().trim().min(10, 'Rüya açıklaması en az 10 karakter olmalıdır').max(5000, 'Rüya açıklaması en fazla 5000 karakter olabilir')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Validate input with Zod
    const validation = dreamSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Geçersiz veri formatı'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { dreamDescription } = validation.data;
    console.log('Dream interpretation request');

    // Check and deduct credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 20) {
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const rateLimitWindow = 60000
    const rateLimitMax = 10
    const now = new Date()
    const windowStart = new Date(now.getTime() - rateLimitWindow)

    const { data: rateLimit } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', 'interpret-dream')
      .gte('window_start', windowStart.toISOString())
      .single()

    if (rateLimit && rateLimit.request_count >= rateLimitMax) {
      return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (rateLimit) {
      await supabaseClient
        .from('rate_limits')
        .update({ request_count: rateLimit.request_count + 1 })
        .eq('id', rateLimit.id)
    } else {
      await supabaseClient
        .from('rate_limits')
        .insert({ user_id: user.id, endpoint: 'interpret-dream', request_count: 1, window_start: now.toISOString() })
    }

    const prompt = `Sen uzman bir rüya yorumcususun. Aşağıdaki rüyayı Türkçe olarak çok detaylı ve kapsamlı şekilde yorumla:

Rüya: ${dreamDescription}

Yorumunda şunları MUTLAKA içer ve her bölüm çok detaylı olmalı:
1. Rüyadaki ana semboller ve anlamları (minimum 5-6 paragraf, her sembol için ayrı ayrı derinlemesine açıklama)
2. Psikolojik yorumu (minimum 6-7 paragraf, Jung, Freud ve modern rüya psikolojisi perspektifinden detaylı analiz)
3. Manevi/Mistik yorumu (minimum 5-6 paragraf, rüyanın manevi ve ezoterik anlamları)
4. Gelecek hakkında işaretler (minimum 4-5 paragraf, rüyanın geleceğe dair mesajları)
5. Pratik tavsiyeler (minimum 5-6 paragraf, günlük hayata uygulanabilir detaylı öneriler)
6. Uyarılar (minimum 3-4 paragraf, dikkat edilmesi gereken konular)
7. Genel Özet (minimum 6-8 paragraf, tüm yorumları birleştiren kapsamlı değerlendirme)

Her bölümde:
- Sembolizm ve arketipleri derinlemesine açıkla
- Kişiye özel yorumlar yap, genel bilgiler verme
- Minimum 500-700 kelime kullan
- Psikolojik ve manevi boyutları birlikte ele al

ÖNEMLİ: Analizin çok uzun, detaylı ve kapsamlı olmalı. Rüyanın her yönünü incele ve yorumla.

JSON formatında şu yapıda cevap ver:
{
  "symbols": [
    {"symbol": "Sembol", "meaning": "Anlamı"}
  ],
  "psychological": "Psikolojik yorum",
  "spiritual": "Manevi yorum",
  "future_signs": "Gelecek işaretleri",
  "advice": "Tavsiyeler",
  "warnings": "Uyarılar",
  "overall": "Genel özet"
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
          { role: 'system', content: 'Sen deneyimli bir rüya yorumcususun. Psikoloji ve sembolizmden anlarsın.' },
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
      .update({ credits: profile.credits - 20 })
      .eq('user_id', user.id);

    // Save interpretation
    const { data: reading, error: saveError } = await supabaseClient
      .from('dream_interpretations')
      .insert({
        user_id: user.id,
        dream_description: dreamDescription,
        interpretation: interpretation,
        credits_used: 20
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Record transaction
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -20,
        transaction_type: 'deduction',
        description: 'Rüya tabiri',
        reference_id: reading.id
      });

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in interpret-dream function:', error);
    return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});