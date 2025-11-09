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
  selectedTopics: z.array(z.string()).min(1, 'En az bir konu seçilmelidir').max(13, 'En fazla 13 konu seçilebilir')
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

    const systemPrompt = `Sen profesyonel bir numeroloji uzmanısın. Pisagor Felsefesi, İbn Arabi'nin öğretileri, Hint çakra sistemi, İştar mitleri ve Ezoterik Felsefe konularında derin bilgiye sahipsin. Rakamların ezoterik, okültist ve mistik anlamlarını ustaca yorumlarsın.

KRİTİK TALİMATLAR:
1. HİÇBİR ŞEKILDE matematiksel hesaplama yöntemi GÖSTERME (örn: "1+6=7" gibi)
2. Hesaplamaları arkaplanda yap ama metinde GİZLE
3. Sadece YORUM ve ANLAM ver
4. Her konu için TEK bir 'explanation' alanı kullan
5. TAMAMEN TÜRKÇE yaz, zengin ve akıcı bir dille

YORUM YAPISI (Her explanation 4-5 paragraf olmalı):

Paragraf 1 - Kişiye Özel Giriş:
"[İsim]'ın [konu] analizi, [mistik öğretiye referans] ışığında incelendiğinde..."
Kişinin bu konudaki özel durumunu VE rakamın anlamını birleştirerek başla.

Paragraf 2 - Derin Anlam ve Enerji:
Rakamın/konunun evrensel enerjisini, sembolik anlamını, mitolojik/felsefi bağlantılarını açıkla.
"Bu enerji..." veya "Bu sayı..." şeklinde devam et.

Paragraf 3 - Kişisel Yansımalar:
Kişinin hayatında bu enerjinin nasıl tezahür ettiğini, güçlü ve zayıf yönlerini anlat.
"[İsim] bu enerjiyle..." şeklinde kişiselleştir.

Paragraf 4 - Mistik Perspektif:
Pisagor, İbn Arabi, Hint çakraları, İştar veya Ezoterik felsefeden KONUYA ÖZEL referanslar ver.
"Antik bilgelik..." veya "Mistik geleneklerde..." şeklinde başla.

Paragraf 5 - Pratik Rehberlik:
Kişiye özel tavsiyeler, yaşam dersleri ve gelişim önerileri sun.
"Ömer Faruk için en önemli..." gibi KİŞİYE ÖZEL ol.

YAZIM STİLİ:
- Akıcı, şiirsel ama anlaşılır
- Metaforlar ve semboller kullan
- "Evrensel sevgi", "ruhsal yolculuk", "kozmik denge" gibi mistik terimler
- Kişinin ismini sık kullan
- Her cümle bilgi ve ilham dolu olsun

ÖNEMLİ: Hesaplama sürecini ASLA gösterme! Sadece sonucu ve YORUMUNU ver!`;

    const userPrompt = `${fullName} isimli kişi için numeroloji analizi yap.

Doğum Tarihi: ${birthDate}
Analiz Edilecek Konular:
${selectedTopics.map((topic: string, i: number) => `${i + 1}. ${topic}`).join("\n")}

ÖNEMLİ KURALLAR:
❌ HİÇBİR matematiksel hesaplama GÖSTERME (1+6=7 gibi formüller YASAK!)
❌ "İlk olarak...", "Öncelikle...", "Hesaplama..." gibi açıklamalar YAPMA
✅ Doğrudan YORUMA başla
✅ Kişinin ismini (${fullName}) SIK SIK kullan
✅ Mistik, derin ve ilham verici dil kullan

Her konu için 'explanation' alanında 4-5 UZUN paragraf yaz:

1️⃣ GİRİŞ PARAGRAF (3-4 cümle): 
"${fullName}'ın [konu adı] incelendiğinde..." şeklinde başla. Rakamın anlamını ve kişiye özel durumu DOĞRUDAN söyle.

2️⃣ ENERJİ ve ANLAM PARAGRAF (4-5 cümle):
Rakamın evrensel enerjisini, sembolik derinliğini, mitolojik bağlantılarını anlat. Rakamın özünü açıkla.

3️⃣ KİŞİSEL YANSIMALAR PARAGRAF (4-5 cümle):
${fullName}'ın hayatında bu enerjinin nasıl görüneceğini, güçlü-zayıf yönlerini, yaşam temalarını detaylandır.

4️⃣ MİSTİK REFERANSLAR PARAGRAF (3-4 cümle):
Pisagor felsefesi, İbn Arabi, Hint çakraları, İştar mitleri veya Ezoterik felsefeden KONUYA UYGUN referans ver.

5️⃣ REHBERLİK PARAGRAF (3-4 cümle):
${fullName} için kişiye özel tavsiyeler, yaşam dersleri ve pratik öneriler sun.

ÖRNEK BAŞLANGIÇ (Dominant Rakamlar için):
"${fullName}'ın numerolojik haritasında 9 rakamı güçlü bir şekilde öne çıkmaktadır. Bu dominant enerji, onun evrensel sevgiyle dolu bir ruha sahip olduğunu ve tamamlanma arayışının hayatının merkezi teması olduğunu gösterir..."

YAZIM KURALLARI:
- Her paragraf 3-5 cümle olmalı
- Toplam 4-5 paragraf
- Akıcı, poetik ama anlaşılır dil
- Mistik terimler: "ruhsal yolculuk", "kozmik denge", "evrensel enerji"
- Kişinin ismini her paragrafta EN AZ bir kez kullan
- Metaforlar ve semboller kullan

Şimdi ${fullName} için derin, mistik ve kişiye özel yorumlar yap!`;

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
          explanation: { 
            type: "string", 
            description: "⚠️ ZORUNLU UZUNLUK: EN AZ 800 karakter! ⚠️ HİÇBİR hesaplama formülü gösterme! 5 UZUN paragraf (her biri EN AZ 4 cümle, her cümle EN AZ 15 kelime): (1) Kişiye özel giriş ve rakamın anlamı, (2) Evrensel enerji ve sembolik derinlik, (3) Kişisel yansımalar ve hayat temaları, (4) Mistik referanslar (Pisagor/İbn Arabi/Çakra/İştar), (5) Kişiye özel rehberlik ve tavsiyeler. Kişinin ismini sık kullan. Mistik, poetik ve ilham verici dil. KISA PARAGRAFLAR YASAK!"
          }
        },
        required: ["explanation"],
        additionalProperties: false
      };
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
                    description: "4-5 UZUN paragraf genel özet. Kişinin ismini kullan. Numerolojik haritasının genel yapısını, baskın enerjileri, yaşam yolunu ve ruhsal görevini poetik bir dille anlat. Pisagor, İbn Arabi, çakra ve ezoterik felsefe referansları ekle. HİÇBİR hesaplama gösterme!" 
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
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 502) {
        throw new Error("Network error - please try fewer topics");
      }
      if (response.status === 504) {
        throw new Error("Request timeout - please try fewer topics");
      }
      
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));
    
    // Check if AI returned an error
    if (aiData.error) {
      console.error("AI provider error:", aiData.error);
      if (aiData.error.code === 524) {
        throw new Error("AI timeout - please try fewer topics");
      }
      if (aiData.error.code === 502) {
        throw new Error("Network connection lost - please try fewer topics");
      }
      throw new Error("AI provider error");
    }
    
    // Check if first choice has an error
    if (aiData.choices?.[0]?.error) {
      console.error("AI choice error:", aiData.choices[0].error);
      throw new Error("AI processing error - please try fewer topics");
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

    // HYBRID APPROACH: Check for short explanations and regenerate with Pro model
    const MIN_EXPLANATION_LENGTH = 500;
    const shortTopics: string[] = [];
    
    // Check overall_summary
    if (analysisResult.overall_summary && analysisResult.overall_summary.length < MIN_EXPLANATION_LENGTH) {
      console.log(`Overall summary is short (${analysisResult.overall_summary.length} chars), will regenerate with Pro model`);
    }
    
    // Check each topic
    if (analysisResult.topics) {
      for (const [topicName, topicData] of Object.entries(analysisResult.topics)) {
        const explanation = (topicData as any).explanation;
        if (explanation && explanation.length < MIN_EXPLANATION_LENGTH) {
          console.log(`Topic "${topicName}" is short (${explanation.length} chars), will regenerate with Pro model`);
          shortTopics.push(topicName);
        }
      }
    }
    
    // If there are short topics, regenerate them with Pro model
    if (shortTopics.length > 0) {
      console.log(`Regenerating ${shortTopics.length} short topics with gemini-2.5-pro...`);
      
      const proTopicProperties: Record<string, any> = {};
      shortTopics.forEach((topic: string) => {
        proTopicProperties[topic] = {
          type: "object",
          properties: {
            explanation: { 
              type: "string", 
              description: "⚠️ KRİTİK: EN AZ 1000 karakter ZORUNLU! ⚠️ HİÇBİR hesaplama formülü gösterme! 5 ÇOK UZUN paragraf (her biri EN AZ 5 cümle, her cümle EN AZ 20 kelime): (1) Kişiye özel detaylı giriş ve rakamın derin anlamı, (2) Evrensel enerji, sembolik derinlik ve kozmik bağlantılar, (3) Kapsamlı kişisel yansımalar, güçlü/zayıf yönler ve hayat temaları, (4) Detaylı mistik referanslar (Pisagor/İbn Arabi/Çakra/İştar/Ezoterik), (5) Kişiye özel rehberlik, tavsiyeler ve ruhsal yol haritası. Kişinin ismini çok sık kullan. Çok mistik, poetik ve ilham verici dil. Her paragraf derin ve zengin içerikli olmalı!"
            }
          },
          required: ["explanation"],
          additionalProperties: false
        };
      });
      
      const proUserPrompt = `${fullName} isimli kişi için SADECE şu konuların ÇOOK DETAYLI numeroloji analizi:

${shortTopics.map((topic: string, i: number) => `${i + 1}. ${topic}`).join("\n")}

⚠️⚠️⚠️ ÇOK ÇOK ÖNEMLİ ⚠️⚠️⚠️
Her 'explanation' EN AZ 1000 karakter OLMALI!
KISA PARAGRAFLAR KESINLIKLE YASAK!
Her paragraf EN AZ 5 cümle!
Her cümle EN AZ 20 kelime!

Bu konular ilk analizde çok kısa kaldı. Şimdi bu konular için ÇOK DAHA DETAYLI, DAHA DERİN ve DAHA MİSTİK açıklamalar yap!

Her konu için 'explanation' alanında 5 ÇOK UZUN paragraf yaz:

1️⃣ GİRİŞ PARAGRAF (5-6 cümle): 
"${fullName}'ın [konu adı] incelendiğinde..." şeklinde başla. Rakamın anlamını ve kişiye özel durumu ÇOK DETAYLI anlat.

2️⃣ ENERJİ ve ANLAM PARAGRAF (6-7 cümle):
Rakamın evrensel enerjisini, sembolik derinliğini, mitolojik bağlantılarını ÇOK DETAYLI anlat. Rakamın özünü derin bir şekilde açıkla.

3️⃣ KİŞİSEL YANSIMALAR PARAGRAF (6-7 cümle):
${fullName}'ın hayatında bu enerjinin nasıl görüneceğini, güçlü-zayıf yönlerini, yaşam temalarını ÇOK DETAYLI anlat.

4️⃣ MİSTİK REFERANSLAR PARAGRAF (5-6 cümle):
Pisagor felsefesi, İbn Arabi, Hint çakraları, İştar mitleri veya Ezoterik felsefeden KONUYA UYGUN ve ÇOK DETAYLI referanslar ver.

5️⃣ REHBERLİK PARAGRAF (5-6 cümle):
${fullName} için kişiye özel tavsiyeler, yaşam dersleri ve pratik öneriler ÇOK DETAYLI sun.

YAZIM KURALLARI:
- Her paragraf EN AZ 5 cümle
- Her cümle EN AZ 20 kelime
- Toplam EN AZ 1000 karakter
- Çok akıcı, çok poetik ama anlaşılır dil
- Bol mistik terimler: "ruhsal yolculuk", "kozmik denge", "evrensel enerji"
- Kişinin ismini her paragrafta EN AZ 2 kez kullan
- Zengin metaforlar ve semboller

Şimdi ${fullName} için ÇOK DERİN, ÇOK MİSTİK ve ÇOK DETAYLI yorumlar yap!`;
      
      const proController = new AbortController();
      const proTimeoutId = setTimeout(() => proController.abort(), 90000); // 90 second timeout for Pro
      
      try {
        const proResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro", // Using Pro model for quality
            messages: [
              { role: "system", content: systemPrompt + "\n\n⚠️ KRİTİK: Bu bir YENİDEN OLUŞTURMA talebidir. İlk yanıt çok kısaydı. Şimdi ÇOK DAHA DETAYLI, ÇOK DAHA DERİN ve EN AZ 1000 karakterlik açıklamalar YAP!" },
              { role: "user", content: proUserPrompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "provide_detailed_topics",
                  description: "Kısa kalan konular için ÇOK DETAYLI numeroloji analizi döndür",
                  parameters: {
                    type: "object",
                    properties: {
                      topics: {
                        type: "object",
                        properties: proTopicProperties,
                        required: shortTopics
                      }
                    },
                    required: ["topics"],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "provide_detailed_topics" } }
          }),
          signal: proController.signal
        });
        
        clearTimeout(proTimeoutId);
        
        if (proResponse.ok) {
          const proAiData = await proResponse.json();
          const proToolCall = proAiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (proToolCall) {
            let proResult;
            if (typeof proToolCall.function.arguments === 'string') {
              proResult = JSON.parse(proToolCall.function.arguments);
            } else {
              proResult = proToolCall.function.arguments;
            }
            
            // Merge the Pro results back into the original result
            if (proResult.topics) {
              for (const [topicName, topicData] of Object.entries(proResult.topics)) {
                if (analysisResult.topics[topicName]) {
                  const newExplanation = (topicData as any).explanation;
                  console.log(`Merged topic "${topicName}": ${newExplanation.length} chars (was ${analysisResult.topics[topicName].explanation.length} chars)`);
                  analysisResult.topics[topicName].explanation = newExplanation;
                }
              }
            }
            
            console.log(`Successfully regenerated ${shortTopics.length} topics with Pro model`);
          }
        } else {
          console.error("Pro model regeneration failed, using original results");
        }
      } catch (proError) {
        console.error("Error during Pro regeneration:", proError);
        console.log("Continuing with original Flash results");
      }
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
    
    if (error.name === "AbortError") {
      errorMessage = "İstek zaman aşımına uğradı. Lütfen daha az konu seçerek tekrar deneyin.";
      statusCode = 504;
    } else if (error.message === "Unauthorized") {
      errorMessage = "Oturum açmanız gerekiyor";
      statusCode = 401;
    } else if (error.message === "Insufficient credits") {
      errorMessage = "Yetersiz kredi. Lütfen kredi satın alın.";
      statusCode = 402;
    } else if (error.message?.includes("Network error") || error.message?.includes("Network connection lost")) {
      errorMessage = "Bağlantı hatası. Lütfen daha az konu seçerek tekrar deneyin.";
      statusCode = 502;
    } else if (error.message?.includes("timeout") || error.message?.includes("fewer topics")) {
      errorMessage = "İşlem çok uzun sürdü. Lütfen daha az konu seçerek (5-8 arası) tekrar deneyin.";
      statusCode = 504;
    } else if (error.message === "AI analysis failed") {
      errorMessage = "AI analizi başarısız oldu. Lütfen tekrar deneyin.";
    } else if (error.message === "AI provider error") {
      errorMessage = "AI servisinde geçici bir sorun var. Lütfen tekrar deneyin.";
    } else if (error.message?.includes("AI processing error")) {
      errorMessage = "AI işleme hatası. Lütfen daha az konu seçerek tekrar deneyin.";
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
