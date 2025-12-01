import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, RateLimitPresets } from '../_shared/rateLimit.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const logger = createLogger('analyze-palmistry');

// Input validation schema - max 10MB base64 image
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const palmistrySchema = z.object({
  handImage: z.string()
    .refine((val) => val.startsWith('data:image/'), { message: 'Geçersiz görsel formatı' })
    .refine((val) => {
      // Estimate base64 size (roughly 4/3 of original)
      const base64Length = val.split(',')[1]?.length || 0;
      const estimatedSize = (base64Length * 3) / 4;
      return estimatedSize <= MAX_IMAGE_SIZE;
    }, { message: 'Görsel boyutu çok büyük (maks 10MB)' })
});

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

    // Rate limiting using shared utility
    const rateLimitResult = await checkRateLimit(
      supabaseClient,
      user.id,
      {
        ...RateLimitPresets.ANALYSIS,
        endpoint: 'analyze-palmistry',
      }
    );

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        }
      });
    }
    
    logger.success({ requestId, action: 'user_authenticated', userId: user.id });

    const body = await req.json();
    
    // Validate input
    const validation = palmistrySchema.safeParse(body);
    if (!validation.success) {
      await logger.warning('Validation failed', { requestId, userId: user.id, error: validation.error });
      return new Response(JSON.stringify({ 
        error: 'Geçersiz veri formatı',
        details: validation.error.errors[0].message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { handImage } = validation.data;
    logger.success({ requestId, action: 'validation_passed', userId: user.id });

    // Check and deduct credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 35) {
      await logger.warning('Insufficient credits', { requestId, userId: user.id, available: profile?.credits });
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Sen deneyimli bir el okuma uzmanısın. Bu avuç içi fotoğrafını detaylı analiz et ve TAMAMEN TÜRKÇE yorum yap.

El okumada analiz edilmesi gerekenler:
1. Ana Çizgiler:
   - Hayat çizgisi - 2-3 paragraf analiz
   - Akıl çizgisi - 2-3 paragraf analiz
   - Kalp çizgisi - 2-3 paragraf analiz
   - Kader çizgisi - 2-3 paragraf analiz

2. İkincil Çizgiler ve İşaretler (2-3 paragraf)

3. Parmak ve Tırnak Analizi (2 paragraf)

4. El Şekli ve Yüzeyi (2 paragraf)

Her çizgi için:
- Uzunluk, derinlik, kalite açıkla
- Kesintiler, dallanmalar, işaretler yorumla
- Kişilik, sağlık, kariyer, ilişkiler açısından anlam belirt
- Yaklaşık 200-300 kelime kullan
- TAMAMEN TÜRKÇE yaz, hiçbir İngilizce kelime kullanma

Her alan için (kişilik, sağlık, kariyer, ilişkiler, gelecek):
- 3-4 paragraf detaylı analiz yap
- Eldeki işaretlere göre kişiye özel yorumlar sun
- Mistik ve geleneksel el okuma bilgilerini birleştir

ÖNEMLİ: Analizin detaylı olmalı. Elde gördüğün önemli detayları yorumla. Cevabın TAMAMEN TÜRKÇE olmalı.

JSON formatında şu yapıda cevap ver:
{
  "life_line": "Hayat çizgisi yorumu",
  "head_line": "Akıl çizgisi yorumu",
  "heart_line": "Kalp çizgisi yorumu",
  "fate_line": "Kader çizgisi yorumu",
  "personality": "Kişilik analizi",
  "health": "Sağlık yorumu",
  "career": "Kariyer ve yetenek",
  "relationships": "İlişkiler",
  "future": "Gelecek işaretleri",
  "special_marks": [
    {"mark": "İşaret", "meaning": "Anlamı", "location": "Konumu"}
  ],
  "overall": "Genel özet ve tavsiyeler"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { 
            role: 'system', 
            content: 'Sen el okuma konusunda uzman bir yorumcusun. Avuç çizgilerini ve işaretlerini okursun. TAMAMEN TÜRKÇE yanıt verirsin, hiçbir İngilizce kelime kullanmazsın.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: handImage } }
            ]
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    logger.success({ requestId, action: 'ai_response_received', userId: user.id });

    if (!response.ok || !data.choices || !data.choices[0]) {
      await logger.error('AI API error', { requestId, userId: user.id, error: data });
      return new Response(JSON.stringify({ error: 'AI servisi geçici olarak kullanılamıyor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      .update({ credits: profile.credits - 35 })
      .eq('user_id', user.id);

    // Save reading
    const { data: reading, error: saveError } = await supabaseClient
      .from('palmistry_readings')
      .insert({
        user_id: user.id,
        hand_image_data: handImage,
        interpretation: interpretation,
        credits_used: 35
      })
      .select()
      .single();

    if (saveError) {
      await logger.error('Error saving reading', { requestId, userId: user.id, error: saveError });
      return new Response(JSON.stringify({ error: 'Okuma kaydedilemedi' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record transaction
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -35,
        transaction_type: 'deduction',
        description: 'El okuma (Palmistry)',
        reference_id: reading.id
      });

    const duration = performance.now() - startTime;
    logger.performance(duration, true);
    logger.success({ 
      requestId, 
      action: 'request_completed',
      userId: user.id,
      duration: `${duration.toFixed(2)}ms` 
    });

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, {
      requestId,
      duration: `${duration.toFixed(2)}ms`
    });
    logger.performance(duration, false, (error as Error).constructor.name);
    
    let errorMessage = "El okuma analizi sırasında bir hata oluştu";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        errorMessage = "Oturum açmanız gerekiyor";
        statusCode = 401;
      } else if (error.message === "Insufficient credits") {
        errorMessage = "Yetersiz kredi. Lütfen kredi satın alın.";
        statusCode = 402;
      } else if (error.message.includes("AI")) {
        errorMessage = "AI servisi şu anda kullanılamıyor. Lütfen tekrar deneyin.";
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});