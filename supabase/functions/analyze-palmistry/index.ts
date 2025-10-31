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

    const { handImage } = await req.json();
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

    const prompt = `Sen deneyimli bir el falı (palmistry) uzmanısın. Bu avuç içi fotoğrafını analiz et ve Türkçe detaylı bir yorum yap.

El falında analiz edilmesi gerekenler:
1. Ana Çizgiler:
   - Hayat çizgisi (Life line)
   - Akıl çizgisi (Head line)
   - Kalp çizgisi (Heart line)
   - Kader çizgisi (Fate line)

2. İkincil Çizgiler ve İşaretler

3. Parmak ve Tırnak Analizi

4. El Şekli ve Yüzeyi

Her çizgi için:
- Uzunluğu ve derinliği
- Kesintileri ve işaretleri
- Anlamı ve yorumu

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
        temperature: 0.7,
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
      throw saveError;
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
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});