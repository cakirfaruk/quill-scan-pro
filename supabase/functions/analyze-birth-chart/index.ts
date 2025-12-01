import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { checkRateLimit, RateLimitPresets } from '../_shared/rateLimit.ts'

const birthChartTopics = [
  "Güneş Burcu (Kişilik)",
  "Ay Burcu (Duygular)",
  "Yükselen Burcu (Dış Görünüm)",
  "Merkür (İletişim)",
  "Venüs (Aşk & İlişkiler)",
  "Mars (Enerji & Tutku)",
  "Jüpiter (Büyüme & Şans)",
  "Satürn (Sorumluluk & Dersler)",
  "Uranüs (Değişim & Yenilik)",
  "Neptün (Rüyalar & Sezgi)",
  "Plüton (Dönüşüm & Güç)",
  "Chiron (Yaralı İyileştirici)",
  "Evler (Yaşam Alanları)",
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
    const { fullName, birthDate, birthTime, birthPlace, selectedTopics, chartData } = await req.json();
    
    // Validate inputs
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Geçersiz isim" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!birthDate || isNaN(Date.parse(birthDate)) || new Date(birthDate) > new Date()) {
      return new Response(
        JSON.stringify({ error: "Geçersiz doğum tarihi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!birthTime || typeof birthTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)/.test(birthTime)) {
      return new Response(
        JSON.stringify({ error: "Geçersiz doğum saati" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!birthPlace || typeof birthPlace !== 'string' || birthPlace.trim().length < 2 || birthPlace.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: "Geçersiz doğum yeri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(selectedTopics) || selectedTopics.length === 0 || selectedTopics.length > 20) {
      return new Response(
        JSON.stringify({ error: "Geçersiz konu seçimi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Kimlik doğrulama gerekli" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }
    
    // Rate limiting for AI analysis
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      {
        ...RateLimitPresets.ANALYSIS,
        endpoint: 'analyze-birth-chart',
      }
    );

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.',
        resetAt: rateLimitResult.resetAt
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        }
      });
    }
    
    const creditsNeeded = selectedTopics.length;
    
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

    console.log("Starting birth chart analysis...");
    
    // Use chart data calculated on client-side
    const latitude = chartData?.latitude || 40.1917;
    const longitude = chartData?.longitude || 29.0610;
    const planetarySigns = chartData?.gezegen_burclari || {};
    
    console.log("Using client-calculated chart data:", { latitude, longitude, planetarySigns });

    // Create comprehensive prompt with real data
    const planetaryDataText = `
✅ GERÇEK ASTRONOMİK HESAPLAMALAR (Moshier Ephemeris):

Koordinatlar: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E

Gezegen Konumları:
${JSON.stringify(planetarySigns, null, 2)}

ÖNEMLİ: Bu gerçek astronomik verilere dayanarak profesyonel analiz yap. Gezegenlerin burçlarını ve derecelerini dikkate al.
`;

    const systemPrompt = `Sen profesyonel bir astrolog ve doğum haritası uzmanısın. "Doğum Haritası Yorumlama Sanatı" kitabındaki yöntemleri kullanarak çok detaylı ve kapsamlı analiz yapıyorsun. TAMAMEN TÜRKÇE yanıt verirsin, hiçbir İngilizce kelime kullanmazsın.

${planetaryDataText}

Doğum Bilgileri:
- İsim: ${fullName}
- Doğum Tarihi: ${birthDate}
- Doğum Saati: ${birthTime}
- Doğum Yeri: ${birthPlace}

Seçilen Konular: ${selectedTopics.join(", ")}

ANALIZ YÖNTEMİ:
Verilen gerçek gezegen pozisyonlarını kullanarak her konu için ÇOK DETAYLI analiz yap:

1. **Element Analizi**: Ateş, Toprak, Hava, Su elementlerinin dağılımını derinlemesine incele
2. **Nitelik Analizi**: Öncü, Sabit, Değişken burçların dağılımını detaylıca açıkla
3. **Güçlü Planetler**: Kendi burçlarında, yükselen, köşelerde olan planetleri kapsamlıca değerlendir
4. **Açılar**: Gezegenlerin birbirleriyle yaptığı açıları (kavuşum, trigon, kare, karşıt vb.) uzun uzadıya yorumla
5. **Evler**: 12 astrolojik evin yaşam alanlarındaki etkilerini derinlemesine analiz et
6. **Yükselen**: Dış görünüm ve yaklaşım tarzını detaylıca açıkla
7. **Orta Göğe (MC)**: Kariyer ve sosyal statüyü kapsamlıca değerlendir

Her konu için:

1. **Güneş Burcu**: Temel kişilik, hayat amacı, bilinç - 3-4 paragraf
2. **Ay Burcu**: Duygusal dünya, iç güvenlik, sezgiler - 3-4 paragraf
3. **Yükselen Burcu**: Dış görünüm, ilk izlenim, yaklaşım - 3-4 paragraf
4. **Merkür**: İletişim, düşünce, öğrenme - 2-3 paragraf
5. **Venüs**: Aşk, estetik, ilişkiler, değerler - 2-3 paragraf
6. **Mars**: Enerji, öfke, tutku, cinsellik - 2-3 paragraf
7. **Jüpiter**: Büyüme, şans, felsefe, inançlar - 2-3 paragraf
8. **Satürn**: Sorumluluk, kısıtlama, dersler - 2-3 paragraf
9. **Uranüs**: Bireysellik, orijinallik, değişim - 2 paragraf
10. **Neptün**: Rüyalar, sezgi, maneviyat - 2 paragraf
11. **Plüton**: Dönüşüm, güç, psikoloji - 2 paragraf
12. **Evler**: 12 evin yaşam alanları etkileri - 4-5 paragraf

ÖNEMLİ: Her konu için 250-400 kelime kullan. Analizler detaylı ve kişiye özel olmalı.

Yanıtını Türkçe ve JSON formatında ver:
{
  "isim": "Kişinin adı",
  "dogum_tarihi": "Doğum tarihi",
  "dogum_saati": "Doğum saati",
  "dogum_yeri": "Doğum yeri",
  "astronomik_veriler": {
    "gercek_hesaplama": true/false,
    "planet_pozisyonlari": "Özet bilgi",
    "gezegen_burclari": ${JSON.stringify(planetarySigns)}
  },
  "seçilen_konular": {
    "konu_adı": {
      "genel_bakis": "2-3 paragraf konunun detaylı açıklaması",
      "ozellikler": ["Her özellik 1-2 cümle açıklama ile"],
      "guclu_yonler": "2-3 paragraf güçlü yönlerin analizi",
      "dikkat_edilmesi_gerekenler": "2 paragraf dikkat edilmesi gereken noktalar",
      "tavsiyeler": "2-3 paragraf kişisel gelişim tavsiyeleri"
    }
  },
  "genel_degerlendirme": "4-5 paragraf tüm konuları birleştiren kapsamlı değerlendirme"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Lütfen ${fullName} için doğum haritası analizi yap. Doğum tarihi: ${birthDate}, doğum saati: ${birthTime}, doğum yeri: ${birthPlace}. Seçilen konular: ${selectedTopics.join(", ")}. JSON formatında detaylı analiz ver.`,
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
    console.log("Birth chart analysis completed successfully");
    
    let analysisResult;
    try {
      const content = data.choices[0].message.content;
      
      // Try to extract JSON from markdown code blocks
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0].trim();
      }
      
      analysisResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      // Try to use raw content as fallback
      try {
        analysisResult = JSON.parse(data.choices[0].message.content);
      } catch (e2) {
        console.error("Second parse attempt failed:", e2);
        throw new Error("AI yanıtı beklenmeyen formatta. Lütfen tekrar deneyin.");
      }
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditsNeeded })
      .eq("user_id", user.id);
    
    if (updateError) {
      console.error("Error updating credits:", updateError);
    }
    
    // Save analysis to database
    await supabase.from("birth_chart_analyses").insert({
      user_id: user.id,
      full_name: fullName,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      selected_topics: selectedTopics,
      credits_used: creditsNeeded,
      result: analysisResult,
    });
    
    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsNeeded,
      transaction_type: "birth_chart",
      description: `Doğum haritası analizi (${creditsNeeded} kredi)`,
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-birth-chart function:", error);
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