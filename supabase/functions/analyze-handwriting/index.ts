import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const allTopics = [
  "Marjlar (Sol, Sağ, Üst, Alt)",
  "Satır Yönü",
  "Satır Aralığı",
  "Kelime Aralığı",
  "Harf Aralığı",
  "Yazı Boyutu",
  "Yazı Eğimi",
  "Baskı",
  "Yazı Hızı",
  "Form Seviyesi",
  "Hareket",
  "Bağlantı Şekilleri",
  "Kişisel Zamirler",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, selectedTopics } = await req.json();
    
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
    
    // Check if specific topics are selected or full analysis
    const isFullAnalysis = !selectedTopics || selectedTopics.length === 0;
    const topicsToAnalyze = isFullAnalysis ? allTopics : selectedTopics;
    const creditsNeeded = topicsToAnalyze.length;
    
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Starting handwriting analysis...");

    const systemPrompt = `Sen profesyonel bir grafoloji uzmanısın. El yazısı analizi konusunda derin bilgiye sahipsin. 
    
Görevin, verilen el yazısı görselini detaylı şekilde analiz etmek ve şu başlıklar altında değerlendirmek:

1. MARJLAR (Margins)
   - Sol marj (dar, geniş, daralan, genişleyen, dalgalı)
   - Sağ marj (dar, geniş, daralan, genişleyen, dalgalı)
   - Üst marj (dar, geniş)
   - Alt marj (dar, geniş)

2. SATIR YÖNÜ (Line Direction)
   - Yükselen satırlar
   - Alçalan satırlar
   - Düz satırlar
   - Dalgalı satırlar

3. SATIR ARAĞI (Line Spacing)
   - Dar satır aralığı
   - Geniş satır aralığı
   - Normal satır aralığı

4. KELİME ARALIKLARI (Word Spacing)
   - Dar kelime aralığı
   - Geniş kelime aralığı
   - Normal kelime aralığı

5. HARF ARALIKLARI (Letter Spacing)
   - Bitişik harfler
   - Aralıklı harfler
   - Normal aralık

6. HARFLERİN MEYİL YÖNÜ (Slant)
   - Sağa yatık
   - Sola yatık
   - Dik
   - Karışık meyil

7. YAZININ BOYUTU (Size)
   - Küçük yazı
   - Büyük yazı
   - Orta boy yazı

8. YAZININ BÖLGESEL BOYUTU (Zonal Size)
   - Üst bölge (uzun/kısa)
   - Orta bölge (dar/geniş)
   - Alt bölge (uzun/kısa)

9. HARFLERİN BAĞLARI (Connections)
   - Bağlı yazı
   - Kopuk yazı
   - Karışık bağlantı

10. AÇILAR VE KEMERLER (Angles and Arches)
    - Köşeli yazı
    - Yuvarlak yazı
    - Karışık form

11. HIZ (Speed)
    - Hızlı yazı
    - Yavaş yazı
    - Orta hızda yazı

12. KALEMİN BASKISI (Pressure)
    - Güçlü baskı
    - Hafif baskı
    - Değişken baskı

13. İMZA (Signature) - Eğer varsa
    - İmza konumu
    - İmza boyutu
    - İmza okunabilirliği

Her alt başlık için:
1. Gözlemlediğin özelliği belirt (bulgu)
2. Bu özelliğin kişilik açısından anlamını yaz (yorum)

Her ana başlık için tüm alt başlıkları değerlendirdikten sonra genel bir özet ver.

En son olarak, tüm başlıkları birleştirerek kişinin genel karakteristik özelliklerini özetleyen kapsamlı bir değerlendirme yap.

Yanıtını JSON formatında ver:
{
  "topics": [
    {
      "name": "Başlık adı",
      "subTopics": [
        {
          "name": "Alt başlık adı",
          "finding": "Gözlemlenen özellik",
          "interpretation": "Kişilik yorumu"
        }
      ],
      "summary": "Bu başlık için genel değerlendirme"
    }
  ],
  "overallSummary": "Tüm analizi birleştiren genel değerlendirme"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu el yazısını yukarıdaki kriterlere göre detaylı şekilde analiz et. JSON formatında yanıt ver.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Yetersiz kredi. Lütfen hesabınıza kredi ekleyin." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("Analysis completed successfully");
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      throw new Error("AI yanıtı beklenmeyen formatta. Lütfen tekrar deneyin.");
    }

    // Deduct credits and save analysis
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditsNeeded })
      .eq("user_id", user.id);
    
    if (updateError) {
      console.error("Error updating credits:", updateError);
    }
    
    // Save analysis to history
    await supabase.from("analysis_history").insert({
      user_id: user.id,
      analysis_type: "handwriting",
      selected_topics: topicsToAnalyze,
      credits_used: creditsNeeded,
      result: analysisResult,
      image_data: image,
    });
    
    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsNeeded,
      transaction_type: "analysis",
      description: `El yazısı analizi (${creditsNeeded} kredi)`,
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-handwriting function:", error);
    const errorMessage = error instanceof Error ? error.message : "Analiz sırasında bir hata oluştu";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
