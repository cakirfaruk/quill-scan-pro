import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, RateLimitPresets } from '../_shared/rateLimit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

// Input validation schema - max 10MB base64 images
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const imageValidator = z.string()
  .refine((val) => val.startsWith('data:image/'), { message: 'Geçersiz görsel formatı' })
  .refine((val) => {
    const base64Length = val.split(',')[1]?.length || 0;
    const estimatedSize = (base64Length * 3) / 4;
    return estimatedSize <= MAX_IMAGE_SIZE;
  }, { message: 'Görsel boyutu çok büyük (maks 10MB)' });

const coffeeFortuneSchema = z.object({
  image1: imageValidator,
  image2: imageValidator,
  image3: imageValidator
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

    // Rate limiting using shared utility
    const rateLimitResult = await checkRateLimit(
      supabaseClient,
      user.id,
      {
        ...RateLimitPresets.ANALYSIS,
        endpoint: 'analyze-coffee-fortune',
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

    const body = await req.json();
    
    // Validate input
    const validation = coffeeFortuneSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(JSON.stringify({ 
        error: 'Geçersiz veri formatı',
        details: validation.error.errors[0].message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image1, image2, image3 } = validation.data;
    console.log('Coffee fortune reading request received');

    // Check and deduct credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 40) {
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Sen uzman bir falcısın. Bu 3 farklı açıdan çekilmiş kahve fincanı fotoğraflarını detaylı analiz et ve TAMAMEN TÜRKÇE fal yorumu yap.

İlk fotoğraf: Fincanın ana görünümü
İkinci fotoğraf: Farklı açıdan görünüm
Üçüncü fotoğraf: Tabak görünümü

Yorumunda şunları içer, her bölüm detaylı olmalı:
1. Aşk ve İlişkiler (3-4 paragraf, sembolleri açıkla)
2. Kariyer ve İş (3-4 paragraf, iş hayatı yorumları)
3. Para ve Finans (2-3 paragraf, finansal durum analizi)
4. Sağlık (2-3 paragraf, sağlık durumu ve dikkat edilmesi gerekenler)
5. Gelecek ve Uyarılar (3-4 paragraf, gelecek işaretleri ve uyarılar)
6. Genel Yorum (4-5 paragraf, tüm yorumları birleştiren değerlendirme)

Her bölümde:
- Gördüğün şekilleri ve sembol anlamlarını açıkla
- Mistik ve anlayışlı ol
- Kişiye özel yorumlar yap
- Yaklaşık 200-300 kelime kullan
- TAMAMEN TÜRKÇE yaz, hiçbir İngilizce kelime kullanma

ÖNEMLİ: Fotoğraflardaki detayları incele ve yorumla. Cevabın TAMAMEN TÜRKÇE olmalı.

JSON formatında şu yapıda cevap ver:
{
  "love": "Aşk ve ilişkiler yorumu",
  "career": "Kariyer yorumu",
  "finance": "Finans yorumu",
  "health": "Sağlık yorumu",
  "future": "Gelecek ve uyarılar",
  "symbols": [
    {"name": "Sembol adı", "meaning": "Anlamı", "location": "Konumu"}
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
            content: 'Sen deneyimli bir kahve falı uzmanısın. Fotoğraflardaki kahve telve şekillerini yorumlarsın. TAMAMEN TÜRKÇE yanıt verirsin, hiçbir İngilizce kelime kullanmazsın.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image1 } },
              { type: 'image_url', image_url: { url: image2 } },
              { type: 'image_url', image_url: { url: image3 } }
            ]
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data).slice(0, 200));

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.error('AI API error:', data);
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
      .update({ credits: profile.credits - 40 })
      .eq('user_id', user.id);

    // Save reading
    const { data: reading, error: saveError } = await supabaseClient
      .from('coffee_fortune_readings')
      .insert({
        user_id: user.id,
        image1_data: image1,
        image2_data: image2,
        image3_data: image3,
        interpretation: interpretation,
        credits_used: 40
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving reading:', saveError);
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
        amount: -40,
        transaction_type: 'deduction',
        description: 'Kahve falı',
        reference_id: reading.id
      });

    console.log('Coffee fortune reading completed successfully');

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-coffee-fortune function:', error);
    
    let errorMessage = "Kahve falı analizi sırasında bir hata oluştu";
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