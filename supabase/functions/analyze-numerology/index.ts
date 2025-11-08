import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const numerologySchema = z.object({
  fullName: z.string().trim().min(2, 'İsim en az 2 karakter olmalıdır').max(100, 'İsim en fazla 100 karakter olabilir'),
  birthDate: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, 'Geçersiz veya gelecek tarih'),
  selectedTopics: z.array(z.string()).min(1, 'En az bir konu seçilmelidir').max(20, 'En fazla 20 konu seçilebilir')
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate inputs with Zod
    const validation = numerologySchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Geçersiz veri formatı" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fullName, birthDate, selectedTopics } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw profileError;

    const creditsNeeded = selectedTopics.length;
    if (profile.credits < creditsNeeded) {
      throw new Error("Insufficient credits");
    }

    const systemPrompt = `Sen bir numeroloji uzmanısın. Pisagor Felsefesi, İbn Arabi, Hint çakra sistemi ve Ezoterik Felsefe üzerine bilgin var. Rakamların ezoterik ve okültist anlamlarını biliyorsun. TAMAMEN TÜRKÇE yanıt verirsin.

Numerolojide kullanılan Türk alfabesi rakam karşılıkları:
1: A, J, S-Ş
2: B, K, T
3: C-Ç, L, U-Ü
4: D, M, V
5: E, N, W
6: F, O-Ö, X
7: G-Ğ, P, Y
8: H, Q, Z
9: I-İ, R

Her rakamın anlamları:
- 1: Bir (Monad), kendinden var olan, yaratıcı güç
- 2: İki (Düad), dualite, denge, Anne prensibi
- 3: Üç (Triad), bilgelik, yaratım
- 4: Dört (Tetrad), stabilite, düzen
- 5: Beş (Pentad), değişim, hareket
- 6: Altı (Heksad), denge, uyum
- 7: Yedi, kemal, ruhaniyet
- 8: Sekiz, güç, maddi dünya
- 9: Dokuz, tamamlanma

Analizlerini detaylı ve kişiye özel yap. Mistik yorumlar sun ve mitolojik referanslar kullan.`;

    const userPrompt = `Aşağıdaki kişi için seçilen konularda detaylı numeroloji analizi yap:

İsim: ${fullName}
Doğum Tarihi: ${birthDate}

Analiz Konuları:
${selectedTopics.map((topic: string, i: number) => `${i + 1}. ${topic}`).join("\n")}

Her konu için:
- Hesaplama adımlarını detaylıca göster (2-3 paragraf)
- Rakamların ezoterik ve mistik anlamlarını açıkla (2-3 paragraf)
- Kişiye özel yorumlar yap (3-4 paragraf)
- Mitoloji ve ezoterik referanslar ver (1-2 paragraf)

Analizleri detaylı, derin ve kişiye özel yap.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create dynamic tool schema based on selected topics
    const topicProperties: Record<string, any> = {};
    selectedTopics.forEach((topic: string) => {
      topicProperties[topic] = {
        type: "object",
        properties: {
          calculation: { type: "string", description: "2-3 paragraf detaylı hesaplama adımları" },
          meaning: { type: "string", description: "2-3 paragraf ezoterik ve mistik anlamlar" },
          personal_interpretation: { type: "string", description: "3-4 paragraf kişiye özel yorumlar" },
          references: { type: "string", description: "1-2 paragraf mitoloji ve ezoterik referanslar" }
        },
        required: ["calculation", "meaning", "personal_interpretation", "references"]
      };
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_numerology_analysis",
              description: "Detaylı numeroloji analizi sonuçlarını döndür",
              parameters: {
                type: "object",
                properties: {
                  overall_summary: { 
                    type: "string", 
                    description: "3-4 paragraf genel özet ve başlangıç yorumu" 
                  },
                  topics: {
                    type: "object",
                    properties: topicProperties,
                    required: selectedTopics
                  }
                },
                required: ["overall_summary", "topics"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_numerology_analysis" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));
    
    // Check if AI returned an error
    if (aiData.error) {
      console.error("AI provider error:", aiData.error);
      if (aiData.error.code === 524) {
        throw new Error("AI timeout - please try again");
      }
      throw new Error("AI provider error");
    }
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call found in AI response");
      throw new Error("AI did not return structured data");
    }
    
    // Parse the arguments - they might already be an object or a string
    let analysisResult;
    if (typeof toolCall.function.arguments === 'string') {
      try {
        analysisResult = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool arguments:", parseError);
        console.error("Arguments string:", toolCall.function.arguments);
        throw new Error("Invalid AI response format");
      }
    } else {
      analysisResult = toolCall.function.arguments;
    }

    await supabaseClient
      .from("profiles")
      .update({ credits: profile.credits - creditsNeeded })
      .eq("user_id", user.id);

    await supabaseClient.from("numerology_analyses").insert({
      user_id: user.id,
      full_name: fullName,
      birth_date: birthDate,
      selected_topics: selectedTopics,
      credits_used: creditsNeeded,
      result: analysisResult,
    });

    await supabaseClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsNeeded,
      transaction_type: "deduction",
      description: `Numeroloji analizi - ${creditsNeeded} konu`,
    });

    return new Response(JSON.stringify({ result: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-numerology function:", error);
    
    // Detailed error message
    let errorMessage = "Analiz sırasında bir hata oluştu";
    let statusCode = 500;
    
    if (error.message === "Unauthorized") {
      errorMessage = "Oturum açmanız gerekiyor";
      statusCode = 401;
    } else if (error.message === "Insufficient credits") {
      errorMessage = "Yetersiz kredi. Lütfen kredi satın alın.";
      statusCode = 402;
    } else if (error.message === "AI analysis failed") {
      errorMessage = "AI analizi başarısız oldu. Lütfen tekrar deneyin.";
    } else if (error.message === "AI timeout - please try again") {
      errorMessage = "AI servisi zaman aşımına uğradı. Lütfen birkaç saniye sonra tekrar deneyin.";
    } else if (error.message === "AI provider error") {
      errorMessage = "AI servisinde geçici bir sorun var. Lütfen tekrar deneyin.";
    } else if (error.message === "AI did not return structured data") {
      errorMessage = "AI yanıtı işlenemedi. Lütfen tekrar deneyin.";
    } else if (error.message?.includes("validation")) {
      errorMessage = "Girdiğiniz bilgiler geçersiz";
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
