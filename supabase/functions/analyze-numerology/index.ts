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

    const systemPrompt = `Sen bir numeroloji uzmanısın. Pisagor Felsefesi, İbn Arabi, Hint çakra sistemi, İştar mitleri ve Ezoterik Felsefe üzerine derin bilgin var. Rakamların ezoterik ve okültist anlamlarını biliyorsun.

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
- 1: Bir (Monad), kendinden var olan, yaratıcı güç, başlangıç
- 2: İki (Düad), dualite, karşıtlık, denge, Anne prensibi
- 3: Üç (Triad), bilgelik, yaratım, üçlü birlik
- 4: Dört (Tetrad), stabilite, düzen, dört element
- 5: Beş (Pentad), değişim, hareket, insan
- 6: Altı (Heksad), denge, uyum, sevgi
- 7: Yedi, kemal, mükemmellik, ruhaniyet
- 8: Sekiz, güç, maddi dünya, sonsuzluk
- 9: Dokuz, tamamlanma, yüksek bilinç

Analizlerini detaylı, anlamlı ve kişiye özel yap. Her konuyu ayrı bölümler halinde sun.`;

    const userPrompt = `Aşağıdaki kişi için seçilen konularda detaylı numeroloji analizi yap:

İsim: ${fullName}
Doğum Tarihi: ${birthDate}

Analiz Konuları:
${selectedTopics.map((topic: string, i: number) => `${i + 1}. ${topic}`).join("\n")}

Her konu için:
- Hesaplama adımlarını göster
- Rakamların ezoterik anlamlarını açıkla
- Kişiye özel yorumlar yap
- İlgili mitoloji ve felsefe referansları ver

JSON formatında yanıt ver, her konu için ayrı alan oluştur.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const analysisResult = JSON.parse(aiData.choices[0].message.content);

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
