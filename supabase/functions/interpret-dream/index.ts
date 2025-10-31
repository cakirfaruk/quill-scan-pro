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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { dreamDescription } = await req.json();
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

    const prompt = `Sen uzman bir rüya yorumcususun. Aşağıdaki rüyayı Türkçe olarak detaylıca yorumla:

Rüya: ${dreamDescription}

Yorumunda şunları içer:
1. Rüyadaki ana semboller ve anlamları
2. Psikolojik yorumu
3. Manevi/Mistik yorumu
4. Gelecek hakkında işaretler
5. Pratik tavsiyeler
6. Uyarılar

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Sen deneyimli bir rüya yorumcususun. Psikoloji ve sembolizmden anlarsın.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    let interpretation;
    try {
      interpretation = JSON.parse(data.choices[0].message.content);
    } catch {
      interpretation = { raw: data.choices[0].message.content };
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
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});