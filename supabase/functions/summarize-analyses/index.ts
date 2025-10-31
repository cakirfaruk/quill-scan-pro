import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { analysisIds } = await req.json();

    if (!analysisIds || analysisIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No analysis IDs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all selected analyses
    const analyses = [];
    let totalCredits = 0;

    for (const id of analysisIds) {
      // Check analysis_history first
      let { data: analysis } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!analysis) {
        // Check numerology_analyses
        const { data: numAnalysis } = await supabase
          .from('numerology_analyses')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (numAnalysis) {
          analysis = numAnalysis;
        }
      }

      if (!analysis) {
        // Check birth_chart_analyses
        const { data: birthAnalysis } = await supabase
          .from('birth_chart_analyses')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (birthAnalysis) {
          analysis = birthAnalysis;
        }
      }

      if (!analysis) {
        // Check compatibility_analyses
        const { data: compAnalysis } = await supabase
          .from('compatibility_analyses')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (compAnalysis) {
          analysis = compAnalysis;
        }
      }

      if (analysis) {
        analyses.push(analysis);
        totalCredits += analysis.credits_used;
      }
    }

    if (analyses.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid analyses found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate required credits
    const requiredCredits = Math.ceil((totalCredits * analysisIds.length) / 3);

    // Check user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        required: requiredCredits,
        available: profile?.credits || 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate individual summaries first
    const individualSummaries = [];
    
    for (const analysis of analyses) {
      const analysisContent = JSON.stringify(analysis.result || {});
      
      const summaryPrompt = `Sen bir analiz özetleme asistanısın. Aşağıdaki analiz sonucunu özetle. 
      ÖNEMLI: Özette analiz yöntemine dair teknik detayları (örn: "güneş burcunuz şu", "doğum tarihindeki sayılar toplanınca bu sayı çıkıyor" gibi) KESINLIKLE ekleme. 
      Sadece kullanıcı için önemli olan kişilik özellikleri ve içgörüleri özetle. Kısa, öz ve yararlı bilgiler ver.
      
      Analiz içeriği:
      ${analysisContent}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Sen bir analiz özetleme asistanısın. Kullanıcıya yararlı, kısa ve öz özetler sağlarsın.' },
            { role: 'user', content: summaryPrompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', await aiResponse.text());
        throw new Error('AI API request failed');
      }

      const aiData = await aiResponse.json();
      const summary = aiData.choices[0].message.content;
      individualSummaries.push(summary);
    }

    // If multiple analyses, harmonize them
    let finalSummary = '';
    
    if (individualSummaries.length === 1) {
      finalSummary = individualSummaries[0];
    } else {
      const harmonizePrompt = `Sen bir analiz harmanlama asistanısın. Aşağıdaki birden fazla analiz özetini birleştir ve tutarlı, çelişmeyen tek bir özet oluştur.
      Ortak noktaları vurgula ve farklı perspektifleri dengele. Kısa, öz ve yararlı bir metin oluştur.
      
      Özetler:
      ${individualSummaries.map((s, i) => `\n${i + 1}. ${s}`).join('\n')}`;

      const harmonizeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Sen bir analiz harmanlama asistanısın. Birden fazla analiz özetini tutarlı şekilde birleştirirsin.' },
            { role: 'user', content: harmonizePrompt }
          ],
        }),
      });

      if (!harmonizeResponse.ok) {
        console.error('AI API error:', await harmonizeResponse.text());
        throw new Error('AI API request failed');
      }

      const harmonizeData = await harmonizeResponse.json();
      finalSummary = harmonizeData.choices[0].message.content;
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - requiredCredits })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      throw new Error('Failed to update credits');
    }

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -requiredCredits,
      transaction_type: 'deduction',
      description: `Analiz özeti (${analysisIds.length} analiz)`,
    });

    return new Response(JSON.stringify({ 
      summary: finalSummary,
      creditsUsed: requiredCredits,
      analysisCount: analysisIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in summarize-analyses:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});