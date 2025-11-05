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
const tarotSchema = z.object({
  spreadType: z.enum(['past-present-future', 'love', 'career', 'celtic-cross']),
  question: z.string().max(500).nullable().optional(),
  selectedCards: z.array(z.object({
    name: z.string(),
    suit: z.string().optional(),
    isReversed: z.boolean()
  })).min(1).max(10)
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

    // Database-backed rate limiting
    const rateLimitWindow = 60000; // 1 minute
    const rateLimitMax = 10;
    const now = new Date();
    const windowStart = new Date(now.getTime() - rateLimitWindow);

    const { data: rateLimit } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', 'analyze-tarot')
      .gte('window_start', windowStart.toISOString())
      .single();

    if (rateLimit && rateLimit.request_count >= rateLimitMax) {
      return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rateLimit) {
      await supabaseClient
        .from('rate_limits')
        .update({ request_count: rateLimit.request_count + 1 })
        .eq('id', rateLimit.id);
    } else {
      await supabaseClient
        .from('rate_limits')
        .insert({ 
          user_id: user.id, 
          endpoint: 'analyze-tarot', 
          request_count: 1, 
          window_start: now.toISOString() 
        });
    }

    const body = await req.json();
    
    // Validate input
    const validation = tarotSchema.safeParse(body);
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

    const { spreadType, question, selectedCards } = validation.data;
    console.log('Tarot reading request:', { spreadType, question, cardsCount: selectedCards.length });

    // Check and deduct credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 30) {
      return new Response(JSON.stringify({ error: 'Yetersiz kredi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create detailed prompt based on spread type
    const spreadDescriptions: Record<string, string> = {
      'past-present-future': 'Bu 3 kartlık yayılım geçmiş, şimdi ve gelecek hakkında bilgi verir.',
      'love': 'Bu 5 kartlık yayılım aşk ve ilişkiler hakkında derinlemesine bilgi verir.',
      'career': 'Bu 5 kartlık yayılım kariyer ve iş hayatı hakkında rehberlik sağlar.',
      'celtic-cross': 'Bu 10 kartlık Celtic Cross yayılımı en kapsamlı tarot okumasıdır.'
    };

    const cardsText = selectedCards.map((card: any, index: number) => 
      `${index + 1}. Pozisyon: ${card.name} (${card.suit || 'Major Arcana'}) - ${card.isReversed ? 'Ters' : 'Düz'}`
    ).join('\n');

    const prompt = `Bir tarot uzmanı olarak aşağıdaki tarot okumasını Türkçe olarak çok detaylı ve kapsamlı şekilde yorumla:

Yayılım Türü: ${spreadType}
${spreadDescriptions[spreadType]}

Soru: ${question || 'Genel okuma'}

Seçilen Kartlar:
${cardsText}

Her kart için:
1. Kartın genel anlamını detaylı açıkla (2-3 paragraf)
2. Düz ve ters pozisyonlarındaki anlamları açıkla (2 paragraf)
3. Bu pozisyondaki önemini belirt (2 paragraf)
4. Soru ile ilişkisini yorumla (2-3 paragraf)

Sonunda:
- Genel özet ver (3-4 paragraf)
- Tavsiyeler sun (2-3 paragraf)
- Dikkat edilmesi gerekenleri belirt (2 paragraf)

ÖNEMLİ: Yorumlar mistik, derin ve rehberlik edici olsun. Her kart için yaklaşık 300-400 kelime kullan.

JSON formatında şu yapıda cevap ver:
{
  "cards": [
    {
      "position": "Pozisyon adı",
      "interpretation": "Detaylı yorum",
      "keywords": ["anahtar", "kelimeler"]
    }
  ],
  "overall": "Genel özet ve yorum",
  "advice": "Tavsiyeler",
  "warnings": "Dikkat edilmesi gerekenler"
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
          { role: 'system', content: 'Sen uzman bir tarot okuyucususun. Kartları derinlemesine ve mistik bir şekilde yorumlarsın. TAMAMEN TÜRKÇE yanıt verirsin, hiçbir İngilizce kelime kullanmazsın.' },
          { role: 'user', content: prompt }
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
      .update({ credits: profile.credits - 30 })
      .eq('user_id', user.id);

    // Save reading
    const { data: reading, error: saveError } = await supabaseClient
      .from('tarot_readings')
      .insert({
        user_id: user.id,
        spread_type: spreadType,
        question: question || null,
        selected_cards: selectedCards,
        interpretation: interpretation,
        credits_used: 30
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
        amount: -30,
        transaction_type: 'deduction',
        description: 'Tarot okuma',
        reference_id: reading.id
      });

    console.log('Tarot reading completed successfully');

    return new Response(JSON.stringify({ interpretation, readingId: reading.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-tarot function:', error);
    return new Response(JSON.stringify({ 
      error: 'İşlem sırasında bir hata oluştu'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
