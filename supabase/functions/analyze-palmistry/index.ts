import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

// Rate limiting map
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(userId);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

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

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    
    // Validate input
    const validation = palmistrySchema.safeParse(body);
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

    const { handImage } = validation.data;
    console.log('Palmistry reading request received');

    // Check and deduct credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 35) {
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Sen deneyimli bir el falı (palmistry) uzmanısın. Bu avuç içi fotoğrafını çok detaylı ve kapsamlı şekilde analiz et ve Türkçe detaylı bir yorum yap.

El falında analiz edilmesi gerekenler:
1. Ana Çizgiler:
   - Hayat çizgisi (Life line) - minimum 4-5 paragraf detaylı analiz
   - Akıl çizgisi (Head line) - minimum 4-5 paragraf detaylı analiz
   - Kalp çizgisi (Heart line) - minimum 4-5 paragraf detaylı analiz
   - Kader çizgisi (Fate line) - minimum 4-5 paragraf detaylı analiz

2. İkincil Çizgiler ve İşaretler (minimum 4-5 paragraf)

3. Parmak ve Tırnak Analizi (minimum 3-4 paragraf)

4. El Şekli ve Yüzeyi (minimum 3-4 paragraf)

Her çizgi için MUTLAKA:
- Uzunluğunu, derinliğini, kalitesini detaylıca açıkla
- Kesintileri, dallanan yerleri, işaretleri derinlemesine yorumla
- Kişilik, sağlık, kariyer, ilişkiler açısından anlamını kapsamlıca belirt
- Minimum 400-600 kelime kullan

Her alan için (kişilik, sağlık, kariyer, ilişkiler, gelecek):
- Minimum 5-6 paragraf yazarak çok detaylı analiz yap
- Eldeki işaretlere göre kişiye özel yorumlar sun
- Mistik ve geleneksel palmistry bilgilerini birleştir

ÖNEMLİ: Analizin çok uzun, detaylı ve kapsamlı olmalı. Elde gördüğün her detayı yorumla.

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
            content: 'Sen el falı (palmistry) konusunda uzman bir yorumcusun. Avuç çizgilerini ve işaretlerini okursun.' 
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
        amount: -35,
        transaction_type: 'deduction',
        description: 'El okuma (Palmistry)',
        reference_id: reading.id
      });

    console.log('Palmistry reading completed successfully');

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-palmistry function:', error);
    return new Response(JSON.stringify({ 
      error: 'İşlem sırasında bir hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});