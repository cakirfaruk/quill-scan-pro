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

    // Build a comprehensive, detailed system prompt for in-depth analysis
    let systemPrompt = `Sen profesyonel bir ilişki danışmanı ve uyum analistisin. İki kişi arasındaki uyumu çok detaylı bir şekilde değerlendiriyorsun.

📋 KİŞİ BİLGİLERİ:
Kişi 1: ${name1 || gender1} (${gender1 === "male" ? "Erkek" : "Kadın"})
Kişi 2: ${name2 || gender2} (${gender2 === "male" ? "Erkek" : "Kadın"})

`;

    if (analysisTypes.includes("numerology") && birthDate1 && birthDate2) {
      systemPrompt += `📅 NUMEROLOJI ANALİZİ:
Doğum Tarihleri: ${birthDate1} ve ${birthDate2}
Bu tarihlerden yaşam yolu sayılarını, kader sayılarını ve kişilik sayılarını hesapla. Her kişinin numerolojik profilini çıkar ve aralarındaki uyumu değerlendir.\n\n`;
    }
    
    if (analysisTypes.includes("birth_chart") && birthTime1 && birthPlace1) {
      systemPrompt += `🌟 ASTROLOJİK ANALİZ:
Kişi 1: ${birthDate1} ${birthTime1} ${birthPlace1}
Kişi 2: ${birthDate2} ${birthTime2} ${birthPlace2}
Doğum haritalarını hesapla. Güneş, Ay, Yükselen burçları, Venüs ve Mars konumlarını değerlendir. Evler arası ilişkileri ve aspektleri incele.\n\n`;
    }

    if (analysisTypes.includes("handwriting")) {
      systemPrompt += `✍️ EL YAZISI ANALİZİ:
Sağlanan el yazısı görsellerinden her iki kişinin karakteristik özelliklerini çıkar. Yazı eğimi, baskı gücü, harflerin yapısı, kelimelerin dizilişi gibi detayları incele.\n\n`;
    }

    systemPrompt += `
🎯 DETAYLI UYUM ANALİZİ YAPILACAK ALANLAR:

1. 💫 KİŞİLİK UYUMU
   - Her iki kişinin temel kişilik özellikleri
   - Karakter yapıları arasındaki uyum
   - Güçlü ve zayıf yönler
   - Tamamlayıcı özellikler

2. 💬 İLETİŞİM UYUMU
   - İletişim tarzları
   - Çatışma çözüm yaklaşımları
   - Empati ve anlayış seviyeleri
   - Dinleme ve ifade etme becerileri

3. 💓 DUYGUSAL BAĞ
   - Duygusal ifade tarzları
   - Sevgi dilleri
   - Bağlanma stilleri
   - Duygusal ihtiyaçlar ve karşılanma düzeyi

4. 🎯 DEĞERLER VE HEDEFLER
   - Hayat felsefesi ve değerler
   - Uzun vadeli hedefler
   - Öncelikler ve yaşam görüşü
   - Gelecek planları uyumu

5. 🌍 SOSYAL UYUM
   - Sosyal çevre ve arkadaş ilişkileri
   - Aile değerleri
   - Yaşam tarzı tercihleri
   - Hobi ve ilgi alanları

📊 HER ALAN İÇİN ŞUNLARI BELİRT:
- Her iki kişinin o alandaki özellikleri (person1Finding ve person2Finding)
- Uyum skoru (0-100)
- Detaylı güçlü yanlar (minimum 3 cümle)
- Karşılaşılabilecek zorluklar (minimum 2 cümle)
- Somut ve uygulanabilir öneriler (minimum 3 madde)

🎨 GENEL DEĞERLENDİRME:
- Tüm alanların ortalaması
- İlişkinin genel karakteri
- En güçlü ve en zayıf yönler
- Uzun vadeli başarı potansiyeli
- 5-6 cümlelik kapsamlı özet

⚠️ ÖNEMLİ:
- Her alan için EN AZ 150-200 kelime yaz
- Somut, spesifik ve kişiselleştirilmiş bilgiler ver
- Genel klişelerden kaçın
- Profesyonel ama samimi bir dil kullan

SADECE AŞAĞIDAKİ JSON FORMATINDA YANITLA:
{
  "overallScore": 75,
  "overallSummary": "5-6 cümlelik detaylı genel değerlendirme",
  "person1Analysis": "Kişi 1'in genel profili - 4-5 cümle",
  "person2Analysis": "Kişi 2'nin genel profili - 4-5 cümle",
  "compatibilityAreas": [
    {
      "name": "Kişilik Uyumu",
      "person1Finding": "Kişi 1'in kişilik özellikleri - detaylı analiz 3-4 cümle",
      "person2Finding": "Kişi 2'nin kişilik özellikleri - detaylı analiz 3-4 cümle",
      "compatibilityScore": 80,
      "strengths": "Güçlü yanlar - minimum 3 cümle, spesifik örneklerle",
      "challenges": "Zorluklar - minimum 2 cümle, somut senaryolarla",
      "recommendations": "Öneriler - minimum 3 madde, uygulanabilir tavsiyeleriyle"
    }
    // ... diğer 4 alan için de aynı detayda
  ]
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

    // Remove any whitespace and check if content is empty
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      console.error("Content is empty after trimming");
      throw new Error("AI returned empty response");
    }

    console.log("AI response content (first 500 chars):", trimmedContent.substring(0, 500));

    // With json_object format, content should be pure JSON
    let result;
    try {
      result = JSON.parse(trimmedContent);
      console.log("Successfully parsed JSON result");
    } catch (parseError) {
      console.error("Failed to parse JSON directly:", parseError);
      
      // Fallback: try to extract JSON from markdown blocks
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
        throw new Error("No valid JSON found in AI response");
      }
      
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (finalError) {
        console.error("Final JSON parse failed:", finalError);
        throw new Error("Failed to parse AI response as JSON");
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