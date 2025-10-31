import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image1, image2, gender1, gender2 } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get authorization token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    // Create Supabase client for user verification
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const creditsNeeded = 50;

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.credits < creditsNeeded) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits", 
          required: creditsNeeded, 
          available: profile.credits 
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const systemPrompt = `Sen profesyonel bir grafolog ve ilişki danışmanısın. İki kişinin el yazısını analiz ederek aralarındaki uyumu değerlendirmelisin.

İlk el yazısı: ${gender1 === 'male' ? 'Erkek' : 'Kadın'}
İkinci el yazısı: ${gender2 === 'male' ? 'Erkek' : 'Kadın'}

Her iki el yazısını ayrı ayrı analiz et ve ardından şu başlıklar altında karşılaştırmalı uyum analizi yap:

1. Genel Kişilik Uyumu
2. İletişim Tarzı Uyumu
3. Duygusal Uyum
4. Sosyal Etkileşim Uyumu
5. İş ve Sorumluluk Uyumu
6. Çatışma Çözme Tarzı
7. Güven ve Dürüstlük
8. Enerji Seviyesi Uyumu

Her başlık için:
- İki kişinin bu özelliklerini karşılaştır
- Uyum yüzdesini belirt (0-100)
- Güçlü yanları açıkla
- Potansiyel zorlukları belirt
- Öneriler sun

Sonunda genel uyum skorunu (0-100) ve ilişki için önerileri içeren kapsamlı bir özet ver.

ZORUNLU: Yanıtını aşağıdaki JSON formatında döndür:
{
  "person1Analysis": "İlk kişinin genel el yazısı özellikleri",
  "person2Analysis": "İkinci kişinin genel el yazısı özellikleri",
  "compatibilityAreas": [
    {
      "name": "Başlık adı",
      "person1Finding": "İlk kişinin bu alandaki özellikleri",
      "person2Finding": "İkinci kişinin bu alandaki özellikleri",
      "compatibilityScore": 85,
      "strengths": "Bu alandaki güçlü yanlar",
      "challenges": "Potansiyel zorluklar",
      "recommendations": "Öneriler"
    }
  ],
  "overallScore": 78,
  "overallSummary": "Genel uyum değerlendirmesi ve öneriler"
}`;

    console.log("Calling Lovable AI for compatibility analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: { url: image1 },
              },
              {
                type: "image_url",
                image_url: { url: image2 },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("Compatibility analysis completed successfully");

    // Deduct credits and save analysis
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditsNeeded })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating credits:", updateError);
    }

    // Save compatibility analysis
    const { error: historyError } = await supabase
      .from("compatibility_analyses")
      .insert({
        user_id: user.id,
        image1_data: image1.substring(0, 100), // Save truncated for reference
        image2_data: image2.substring(0, 100),
        gender1,
        gender2,
        result: result,
        credits_used: creditsNeeded,
      });

    if (historyError) {
      console.error("Error saving compatibility analysis:", historyError);
    }

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsNeeded,
      transaction_type: "compatibility",
      description: "Uyum analizi (50 kredi)",
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-compatibility function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});