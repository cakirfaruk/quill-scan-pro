import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

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
    const { fullName, birthDate, birthTime, birthPlace, selectedTopics } = await req.json();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
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
    
    // Step 1: Get real astronomical calculations from Free Astrology API
    console.log("Fetching real planetary positions from Free Astrology API...");
    
    // Parse date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);
    
    // Geocode birthPlace using Google Maps API for accurate coordinates
    let latitude = 41.0082; // Default: Istanbul
    let longitude = 28.9784; // Default: Istanbul
    let timezone = 3; // Turkey UTC+3
    
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (GOOGLE_MAPS_API_KEY) {
      try {
        console.log(`Geocoding location: ${birthPlace}`);
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(birthPlace + ', Turkey')}&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            const location = geocodeData.results[0].geometry.location;
            latitude = location.lat;
            longitude = location.lng;
            console.log(`Geocoded coordinates: ${latitude}, ${longitude}`);
          } else {
            console.warn("No geocoding results found, using default Istanbul coordinates");
          }
        } else {
          console.error("Geocoding API error:", await geocodeResponse.text());
        }
      } catch (error) {
        console.error("Error calling Google Maps Geocoding API:", error);
      }
    } else {
      console.warn("GOOGLE_MAPS_API_KEY not set, using default Istanbul coordinates");
    }

    let realPlanetData = null;
    let planetarySigns: Record<string, string> = {};
    
    try {
      const astrologyApiResponse = await fetch("https://json.freeastrologyapi.com/planets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          month,
          day,
          hours,
          minutes,
          seconds: 0,
          latitude,
          longitude,
          timezone,
          config: {
            observation_point: "topocentric",
            ayanamsha: "lahiri"
          }
        }),
      });

      if (astrologyApiResponse.ok) {
        realPlanetData = await astrologyApiResponse.json();
        console.log("Real planetary positions received successfully");
        
        // Extract zodiac signs for each planet
        if (realPlanetData && realPlanetData.output) {
          const planets = realPlanetData.output;
          
          // Map Turkish planet names
          const planetMap: Record<string, string> = {
            "sun": "Güneş",
            "moon": "Ay",
            "mercury": "Merkür",
            "venus": "Venüs",
            "mars": "Mars",
            "jupiter": "Jüpiter",
            "saturn": "Satürn",
            "uranus": "Uranüs",
            "neptune": "Neptün",
            "pluto": "Plüton",
            "ascendant": "Yükselen"
          };
          
          // Turkish zodiac signs
          const signMap: Record<string, string> = {
            "aries": "Koç",
            "taurus": "Boğa",
            "gemini": "İkizler",
            "cancer": "Yengeç",
            "leo": "Aslan",
            "virgo": "Başak",
            "libra": "Terazi",
            "scorpio": "Akrep",
            "sagittarius": "Yay",
            "capricorn": "Oğlak",
            "aquarius": "Kova",
            "pisces": "Balık"
          };
          
          for (const [planetKey, planetData] of Object.entries(planets)) {
            const planetName = planetMap[planetKey.toLowerCase()];
            const signName = signMap[(planetData as any)?.sign?.toLowerCase()];
            
            if (planetName && signName) {
              planetarySigns[planetName] = signName;
            }
          }
          
          console.log("Extracted planetary signs:", planetarySigns);
        }
      } else {
        console.error("Failed to fetch real planetary data:", await astrologyApiResponse.text());
      }
    } catch (error) {
      console.error("Error calling Free Astrology API:", error);
    }

    // Step 2: Create comprehensive prompt with real data
    const planetaryDataText = realPlanetData ? `
✅ GERÇEK ASTRONOMİK HESAPLAMALAR (Swiss Ephemeris):

Koordinatlar: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
Saat Dilimi: UTC+${timezone}

Planetler ve Konumları:
${JSON.stringify(realPlanetData.output || realPlanetData, null, 2)}

ÖNEMLİ: Bu gerçek astronomik verilere dayanarak profesyonel analiz yap. Gezegenlerin burçlarını, evlerini, açılarını dikkate al.
` : `
⚠️ NOT: Gerçek astronomik hesaplamalar şu anda alınamadı. Verilen doğum bilgilerine göre genel astrolojik prensiplere dayalı yorum yap.
`;

    const systemPrompt = `Sen profesyonel bir astrolog ve doğum haritası uzmanısın. "Doğum Haritası Yorumlama Sanatı" kitabındaki yöntemleri kullanarak detaylı analiz yapıyorsun.

${planetaryDataText}

Doğum Bilgileri:
- İsim: ${fullName}
- Doğum Tarihi: ${birthDate}
- Doğum Saati: ${birthTime}
- Doğum Yeri: ${birthPlace}

Seçilen Konular: ${selectedTopics.join(", ")}

ANALIZ YÖNTEMİ:
${realPlanetData ? "Verilen gerçek gezegen pozisyonlarını kullanarak" : "Genel astrolojik prensiplere göre"} her konu için detaylı analiz yap:

1. **Element Analizi**: Ateş, Toprak, Hava, Su elementlerinin dağılımı
2. **Nitelik Analizi**: Öncü, Sabit, Değişken burçların dağılımı  
3. **Güçlü Planetler**: Kendi burçlarında, yükselen, köşelerde olan planetler
4. **Açılar**: Gezegenlerin birbirleriyle yaptığı açılar (kavuşum, trigon, kare, karşıt vb.)
5. **Evler**: 12 astrolojik evin yaşam alanlarındaki etkileri
6. **Yükselen**: Dış görünüm ve yaklaşım tarzı
7. **Orta Göğe (MC)**: Kariyer ve sosyal statü

Her konu için:

1. **Güneş Burcu**: Temel kişilik özellikleri, hayat amacı, bilinç
2. **Ay Burcu**: Duygusal dünya, iç güvenlik ihtiyaçları, sezgiler
3. **Yükselen Burcu**: Dış görünüm, ilk izlenim, yaklaşım tarzı
4. **Merkür**: İletişim tarzı, düşünce yapısı, öğrenme şekli
5. **Venüs**: Aşk dili, estetik zevk, ilişki tarzı, değerler
6. **Mars**: Enerji kullanımı, öfke ifadesi, tutku, cinsellik
7. **Jüpiter**: Büyüme alanları, şans konuları, felsefe, inançlar
8. **Satürn**: Sorumluluklar, kısıtlamalar, yaşam dersleri, disiplin
9. **Uranüs**: Bireysellik, orijinallik, ani değişimler
10. **Neptün**: Rüyalar, sezgiler, maneviyat, yanılsamalar
11. **Plüton**: Dönüşüm, güç, derin psikoloji
12. **Evler**: 12 astrolojik evin yaşam alanlarındaki etkileri

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
      "genel_bakis": "Konunun genel açıklaması",
      "ozellikler": ["Özellik 1", "Özellik 2", "..."],
      "guclu_yonler": "Güçlü yönler",
      "dikkat_edilmesi_gerekenler": "Dikkat edilmesi gereken noktalar",
      "tavsiyeler": "Kişisel gelişim tavsiyeleri"
    }
  },
  "genel_degerlendirme": "Tüm seçilen konuları birleştiren kapsamlı değerlendirme"
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
    const content = data.choices[0].message.content;
    
    console.log("Birth chart analysis completed successfully");
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      throw new Error("AI yanıtı beklenmeyen formatta. Lütfen tekrar deneyin.");
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