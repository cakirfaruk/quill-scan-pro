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
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const rateLimitWindow = 60000
    const rateLimitMax = 5
    const now = new Date()
    const windowStart = new Date(now.getTime() - rateLimitWindow)

    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', 'analyze-compatibility')
      .gte('window_start', windowStart.toISOString())
      .single()

    if (rateLimit && rateLimit.request_count >= rateLimitMax) {
      return new Response(JSON.stringify({ error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (rateLimit) {
      await supabase
        .from('rate_limits')
        .update({ request_count: rateLimit.request_count + 1 })
        .eq('id', rateLimit.id)
    } else {
      await supabase
        .from('rate_limits')
        .insert({ user_id: user.id, endpoint: 'analyze-compatibility', request_count: 1, window_start: now.toISOString() })
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
      return new Response(JSON.stringify({ error: 'Profil bulunamadı' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.credits < requiredCredits) {
      return new Response(
        JSON.stringify({ 
          error: "Yetersiz kredi", 
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

    let systemPrompt = `Sen profesyonel bir ilişki danışmanı ve uyum analistisin. İki kişi arasındaki uyumu ÇOK DETAYLI ve KAPSAMLI bir şekilde değerlendiriyorsun.

📋 KİŞİ BİLGİLERİ:
Kişi 1: ${name1 || gender1} (${gender1 === "male" ? "Erkek" : "Kadın"})
Kişi 2: ${name2 || gender2} (${gender2 === "male" ? "Erkek" : "Kadın"})

`;

    if (analysisTypes.includes("numerology") && birthDate1 && birthDate2) {
      systemPrompt += `📅 NUMEROLOJI ANALİZİ:
Doğum Tarihleri: ${birthDate1} ve ${birthDate2}
Bu tarihlerden yaşam yolu sayılarını, kader sayılarını ve kişilik sayılarını hesapla. Her kişinin numerolojik profilini çıkar ve aralarındaki uyumu değerlendir.

`;
    }
    
    if (analysisTypes.includes("birth_chart") && birthTime1 && birthPlace1) {
      systemPrompt += `🌟 ASTROLOJİK ANALİZ:
Kişi 1: ${birthDate1} ${birthTime1} ${birthPlace1}
Kişi 2: ${birthDate2} ${birthTime2} ${birthPlace2}
Doğum haritalarını hesapla. Güneş, Ay, Yükselen burçları, Venüs ve Mars konumlarını değerlendir. Evler arası ilişkileri ve aspektleri incele.

`;
    }

    if (analysisTypes.includes("handwriting")) {
      systemPrompt += `✍️ EL YAZISI ANALİZİ:
Sağlanan el yazısı görsellerinden her iki kişinin karakteristik özelliklerini çıkar. Yazı eğimi, baskı gücü, harflerin yapısı, kelimelerin dizilişi gibi detayları incele.

`;
    }

    systemPrompt += `
🎯 DETAYLI UYUM ANALİZİ YAPILACAK ALANLAR:

1. 💫 KİŞİLİK UYUMU (minimum 6-7 paragraf)
2. 💬 İLETİŞİM UYUMU (minimum 5-6 paragraf)
3. 💓 DUYGUSAL BAĞ (minimum 5-6 paragraf)
4. 🎯 DEĞERLER VE HEDEFLER (minimum 4-5 paragraf)
5. 🌍 SOSYAL UYUM (minimum 4-5 paragraf)

ÖNEMLİ: Her alan için ÇOK DETAYLI analiz yap. Minimum 500-700 kelime kullan.

SADECE AŞAĞIDAKİ JSON FORMATINDA YANITLA:
{
  "overallScore": 75,
  "overallSummary": "Minimum 8-10 paragraf uzunluğunda çok detaylı genel değerlendirme - ilişkinin tüm yönlerini kapsamlı şekilde ele al",
  "person1Analysis": "Minimum 6-7 paragraf - Kişi 1'in çok detaylı genel profili, kişilik özellikleri, güçlü ve zayıf yönleri",
  "person2Analysis": "Minimum 6-7 paragraf - Kişi 2'nin çok detaylı genel profili, kişilik özellikleri, güçlü ve zayıf yönleri",
  "compatibilityAreas": [
    {
      "name": "Alan Adı",
      "person1Finding": "Minimum 5-6 paragraf - Kişi 1'in bu alandaki özelliklerinin çok detaylı analizi",
      "person2Finding": "Minimum 5-6 paragraf - Kişi 2'nin bu alandaki özelliklerinin çok detaylı analizi",
      "compatibilityScore": 80,
      "strengths": "Minimum 4-5 paragraf - Güçlü yanların çok detaylı açıklaması ve örneklerle desteklenmesi",
      "challenges": "Minimum 4-5 paragraf - Zorlukların çok detaylı açıklaması ve nasıl üstesinden gelinebileceği",
      "recommendations": "Minimum 5-6 paragraf - İlişkiyi geliştirmek için çok detaylı, uygulanabilir öneriler"
    }
  ]
}`;

    console.log("Calling Lovable AI for compatibility analysis...");

    const messageContent: any[] = [
      { type: "text", text: systemPrompt }
    ];

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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional relationship analyst. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: messageContent,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Ödeme gerekli. Lütfen kredi ekleyin." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI analizi başarısız oldu" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = await response.text();
    console.log("Raw AI response text:", responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response was:", responseText);
      return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response. Full response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      console.error("Content is empty after trimming");
      return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("AI response content (first 500 chars):", trimmedContent.substring(0, 500));

    let result;
    try {
      result = JSON.parse(trimmedContent);
      console.log("Successfully parsed JSON result");
    } catch (parseError) {
      console.error("Failed to parse JSON directly:", parseError);
      
      let jsonStr = trimmedContent;
      if (jsonStr.includes("```json")) {
        const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1];
      } else if (jsonStr.includes("```")) {
        const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1];
      }
      
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not find JSON in response:", trimmedContent);
        return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (finalError) {
        console.error("Final JSON parse failed:", finalError);
        return new Response(JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
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
        image1_data: image1 ? image1.substring(0, 100) : "",
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
      JSON.stringify({ error: 'İşlem başarısız oldu. Lütfen tekrar deneyin.' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
