import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    const { image1, image2, image3 } = await req.json();
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

    const prompt = `Sen uzman bir falcısın. Bu 3 farklı açıdan çekilmiş kahve fincanı fotoğraflarını analiz et ve Türkçe detaylı bir fal yorumu yap.

İlk fotoğraf: Fincanın ana görünümü
İkinci fotoğraf: Farklı açıdan görünüm
Üçüncü fotoğraf: Tabak görünümü

Yorumunda şunları içer:
1. Aşk ve İlişkiler
2. Kariyer ve İş
3. Para ve Finans
4. Sağlık
5. Gelecek ve Uyarılar
6. Genel Yorum

Her bölümde gördüğün şekilleri ve sembol anlamlarını detaylıca açıkla. Mistik ve anlayışlı ol.

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Sen deneyimli bir kahve falı uzmanısın. Fotoğraflardaki kahve telve şekillerini yorumlarsın.' 
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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');

    let interpretation;
    try {
      interpretation = JSON.parse(data.choices[0].message.content);
    } catch {
      interpretation = { raw: data.choices[0].message.content };
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
      throw saveError;
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
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});