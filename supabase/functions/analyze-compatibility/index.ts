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
    const { 
      image1, 
      image2, 
      gender1, 
      gender2,
      name1,
      birthDate1,
      birthTime1,
      birthPlace1,
      name2,
      birthDate2,
      birthTime2,
      birthPlace2,
      analysisTypes = ["handwriting"]
    } = await req.json();

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

    // Check if user has enough credits - 50 per analysis type
    const requiredCredits = analysisTypes.length * 50;

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.credits < requiredCredits) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits", 
          required: requiredCredits, 
          available: profile.credits 
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Analyzing compatibility with types: ${analysisTypes.join(", ")}...`);

    // Build system prompt based on selected analysis types
    let systemPrompt = `Sen profesyonel bir ilişki danışmanı ve uzman analistisin. İki kişi arasındaki uyumu farklı yöntemlerle değerlendiriyorsun.

Seçilen Analiz Türleri: ${analysisTypes.join(", ")}

Birinci kişi: ${gender1 === "male" ? "Erkek" : "Kadın"}
İkinci kişi: ${gender2 === "male" ? "Erkek" : "Kadın"}`;

    if (analysisTypes.includes("handwriting")) {
      systemPrompt += `

## El Yazısı Analizi
Her iki kişinin el yazısını da detaylı olarak analiz et ve şu konularda uyum değerlendirmesi yap:`;
    }
    
    if (analysisTypes.includes("numerology")) {
      systemPrompt += `

## Numeroloji Analizi  
Birinci kişi: ${name1}, Doğum Tarihi: ${birthDate1}
İkinci kişi: ${name2}, Doğum Tarihi: ${birthDate2}
İsimlerden ve doğum tarihlerinden numerolojik sayıları hesaplayıp uyum değerlendir.`;
    }
    
    if (analysisTypes.includes("birth_chart")) {
      systemPrompt += `

## Doğum Haritası Analizi
Birinci kişi: ${name1}, Doğum: ${birthDate1} ${birthTime1}, Yer: ${birthPlace1}
İkinci kişi: ${name2}, Doğum: ${birthDate2} ${birthTime2}, Yer: ${birthPlace2}
Astrolojik doğum haritalarını ve gezegen konumlarını değerlendirerek uyum analizi yap.`;
    }

    systemPrompt += `

Her iki kişinin analizini de detaylı olarak yap ve uyum değerlendirmesi yap:

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

    // Build messages content array
    const messageContent: any[] = [
      { type: "text", text: systemPrompt }
    ];

    // Add images only if handwriting analysis is selected
    if (analysisTypes.includes("handwriting") && image1 && image2) {
      messageContent.push(
        {
          type: "image_url",
          image_url: { url: image1 },
        },
        {
          type: "image_url",
          image_url: { url: image2 },
        }
      );
    }

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
            content: messageContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please add credits to your Lovable workspace.");
      }
      
      throw new Error(`AI analysis failed: ${response.status} - ${errorText}`);
    }

    // Get response text first to debug
    const responseText = await response.text();
    console.log("Raw AI response text:", responseText.substring(0, 500));

    // Try to parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response was:", responseText);
      throw new Error("Failed to parse AI response as JSON");
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response. Full response:", JSON.stringify(data));
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response content:", content.substring(0, 500));

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
      .update({ credits: profile.credits - requiredCredits })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating credits:", updateError);
    }

    // Save compatibility analysis
    const { error: historyError } = await supabase
      .from("compatibility_analyses")
      .insert({
        user_id: user.id,
        image1_data: image1 ? image1.substring(0, 100) : "", // Save truncated for reference
        image2_data: image2 ? image2.substring(0, 100) : "",
        gender1,
        gender2,
        result: {
          ...result,
          analysisTypes,
        },
        credits_used: requiredCredits,
      });

    if (historyError) {
      console.error("Error saving compatibility analysis:", historyError);
    }

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -requiredCredits,
      transaction_type: "compatibility",
      description: `Uyum analizi (${analysisTypes.join(", ")}) - ${requiredCredits} kredi`,
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