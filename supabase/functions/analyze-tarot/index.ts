import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

    const { spreadType, question, selectedCards } = await req.json();
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

    const prompt = `Bir tarot uzmanı olarak aşağıdaki tarot okumasını Türkçe olarak yorumla:

Yayılım Türü: ${spreadType}
${spreadDescriptions[spreadType]}

Soru: ${question || 'Genel okuma'}

Seçilen Kartlar:
${cardsText}

Her kart için:
1. Kartın anlamını açıkla
2. Pozisyonundaki önemini belirt
3. Soru ile ilişkisini yorumla

Sonunda:
- Genel bir özet ver
- Tavsiyeler sun
- Uyarılar belirt

Yorumun mistik, anlayışlı ve rehberlik edici olsun. JSON formatında şu yapıda cevap ver:
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
          { role: 'system', content: 'Sen uzman bir tarot okuyucususun. Kartları derinlemesine ve mistik bir şekilde yorumlarsın.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received:', JSON.stringify(data).slice(0, 200));

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'OpenAI API hatası');
    }

    let interpretation;
    try {
      interpretation = JSON.parse(data.choices[0].message.content);
    } catch {
      interpretation = { raw: data.choices[0].message.content };
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
      throw saveError;
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
      error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});