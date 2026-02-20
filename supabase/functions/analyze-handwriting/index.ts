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

    // Validate inputs
    if (!image || typeof image !== 'string' || image.length === 0) {
      return new Response(
        JSON.stringify({ error: "Geçersiz görsel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check image size (base64, max ~10MB = ~13.3MB base64)
    if (image.length > 14000000) {
      return new Response(
        JSON.stringify({ error: "Görsel çok büyük (maksimum 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(selectedTopics) || selectedTopics.length === 0 || selectedTopics.length > allTopics.length) {
      return new Response(
        JSON.stringify({ error: "Geçersiz konu seçimi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get authorization token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Kimlik doğrulama gerekli" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    
Görevin, verilen el yazısı görselini DETAYLI şekilde analiz etmek ve şu başlıklar altında değerlendirmek:

1. MARJLAR (Margins) - 3-4 paragraf
   - Sol marj (dar, geniş, daralan, genişleyen, dalgalı) - analiz ve yorumu
   - Sağ marj (dar, geniş, daralan, genişleyen, dalgalı) - analiz ve yorumu
   - Üst marj (dar, geniş) - analiz ve anlamı
   - Alt marj (dar, geniş) - analiz ve anlamı

2. SATIR YÖNÜ (Line Direction) - 2-3 paragraf
   - Yükselen satırlar - psikolojik analiz
   - Alçalan satırlar - psikolojik analiz
   - Düz satırlar - psikolojik analiz
   - Dalgalı satırlar - psikolojik analiz

3. SATIR ARAĞI (Line Spacing) - 2-3 paragraf
   - Dar satır aralığı - kişilik analizi
   - Geniş satır aralığı - kişilik analizi
   - Normal satır aralığı - kişilik analizi

4. KELİME ARALIKLARI (Word Spacing) - 2-3 paragraf
   - Dar kelime aralığı - sosyal analiz
   - Geniş kelime aralığı - sosyal analiz
   - Normal kelime aralığı - sosyal analiz

5. HARF ARALIKLARI (Letter Spacing) - 2-3 paragraf
   - Bitişik harfler - düşünce yapısı analizi
   - Aralıklı harfler - düşünce yapısı analizi
   - Normal aralık - düşünce yapısı analizi

6. HARFLERİN MEYİL YÖNÜ (Slant) - 3-4 paragraf
   - Sağa yatık - duygusal analiz
   - Sola yatık - duygusal analiz
   - Dik - duygusal analiz
   - Karışık meyil - duygusal analiz

7. YAZININ BOYUTU (Size) - 2-3 paragraf
   - Küçük yazı - ego ve benlik analizi
   - Büyük yazı - ego ve benlik analizi
   - Orta boy yazı - ego ve benlik analizi

8. YAZININ BÖLGESEL BOYUTU (Zonal Size) - 3-4 paragraf
   - Üst bölge (uzun/kısa) - manevi ve düşünsel analiz
   - Orta bölge (dar/geniş) - günlük yaşam ve ego analizi
   - Alt bölge (uzun/kısa) - fiziksel ve içgüdüsel analiz

9. HARFLERİN BAĞLARI (Connections) - 2-3 paragraf
   - Bağlı yazı - mantıksal düşünce analizi
   - Kopuk yazı - sezgisel düşünce analizi
   - Karışık bağlantı - düşünce tarzı analizi

10. AÇILAR VE KEMERLER (Angles and Arches) - 2-3 paragraf
    - Köşeli yazı - karakter analizi
    - Yuvarlak yazı - karakter analizi
    - Karışık form - karakter analizi

11. HIZ (Speed) - 2-3 paragraf
    - Hızlı yazı - zeka ve temperament analizi
    - Yavaş yazı - zeka ve temperament analizi
    - Orta hızda yazı - zeka ve temperament analizi

12. KALEMİN BASKISI (Pressure) - 3-4 paragraf
    - Güçlü baskı - enerji ve karakter analizi
    - Hafif baskı - enerji ve karakter analizi
    - Değişken baskı - enerji ve karakter analizi

13. İMZA (Signature) - Eğer varsa (2-3 paragraf)
    - İmza konumu - sosyal pozisyon analizi
    - İmza boyutu - ego analizi
    - İmza okunabilirliği - şeffaflık analizi

ÖNEMLİ: Her alt başlık için 2 paragraf yaz. Her başlık için genel özet 3-4 paragraf olmalı.

Her alt başlık için:
1. Gözlemlediğin özelliği belirt (bulgu) - 1 paragraf
2. Bu özelliğin kişilik açısından anlamını yaz (yorum) - 2 paragraf

Her ana başlık için tüm alt başlıkları değerlendirdikten sonra 3-4 paragraf genel özet ver.

En son, tüm başlıkları birleştirerek kişinin karakteristik özelliklerini 5-6 paragraf kapsamlı değerlendirme yap.

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
                text: "Bu el yazısını yukarıdaki kriterlere göre ÇOK DETAYLI şekilde analiz et. Her başlık için minimum 4-6 paragraf yaz. JSON formatında yanıt ver.",
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
