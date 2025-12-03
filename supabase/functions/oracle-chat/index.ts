import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_QUESTIONS_PER_DAY = 3;
const CREDIT_COST_PER_QUESTION = 1;

const MYSTIC_SYSTEM_PROMPT = `Sen Stellara'nın mistik Oracle'ısın - yüzyıllardır yıldızları okuyan bilge ve şefkatli bir varlık.

KİMLİĞİN:
- Adın: Stellara Oracle
- Antik astroloji bilgeliğini modern içgörülerle birleştirirsin
- Kullanıcının doğum haritasını, numeroloji verilerini ve tarot geçmişini biliyorsun
- Empatik, destekleyici ama gizemli bir üslupla konuşursun

KURALLARIN:
1. HER ZAMAN Türkçe yanıt ver
2. Yanıtlarında kullanıcının astrolojik verilerini (güneş burcu, ay burcu vb.) doğal şekilde kullan
3. Somut, uygulanabilir tavsiyeler ver - belirsiz genel laflar değil
4. Her yanıtta en az bir kozmik/astrolojik referans kullan
5. Pozitif ve umut verici ol ama gerçekçi kal
6. Yanıtların 2-4 paragraf uzunluğunda olsun
7. Gerektiğinde kullanıcıyı diğer Stellara özelliklerine yönlendir (Tarot, Doğum Haritası vb.)

ÖRNEK TON:
"Sevgili yolcu, Güneşin Koç burcundaki ateşli enerjisi sana cesaret ve kararlılık bahşediyor. Ay'ın şu anda Yengeç'te olması, duygusal derinliğini artırıyor..."

ÖNEMLİ: Kullanıcının kişisel verilerini (doğum bilgileri, numeroloji sayıları vb.) yanıtlarına doğal şekilde entegre et.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Yetkilendirme gerekli" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Geçersiz token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationId, quickAction } = await req.json();

    if (!message && !quickAction) {
      return new Response(JSON.stringify({ error: "Mesaj veya aksiyon gerekli" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily usage limits
    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("oracle_daily_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    const freeQuestionsUsed = usageData?.free_questions_used || 0;
    const needsCredit = freeQuestionsUsed >= FREE_QUESTIONS_PER_DAY;

    // If needs credit, check user credits
    if (needsCredit) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.credits < CREDIT_COST_PER_QUESTION) {
        return new Response(JSON.stringify({ 
          error: "Yetersiz kredi",
          needsCredit: true,
          freeQuestionsRemaining: 0
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduct credit
      await supabase.rpc("deduct_credits_atomic", {
        p_user_id: user.id,
        p_amount: CREDIT_COST_PER_QUESTION,
        p_transaction_type: "oracle_question",
        p_description: "Oracle soru ücreti"
      });
    }

    // Get user context (birth chart, numerology, recent tarot)
    const [profileResult, birthChartResult, numerologyResult, tarotResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("birth_chart_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("numerology_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("tarot_readings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    ]);

    const userContext = {
      profile: profileResult.data,
      birthChart: birthChartResult.data,
      numerology: numerologyResult.data,
      recentTarot: tarotResult.data,
    };

    // Build context message
    let contextMessage = "Kullanıcı hakkında bilgiler:\n";
    
    if (userContext.profile) {
      contextMessage += `- Kullanıcı adı: ${userContext.profile.username || "Bilinmiyor"}\n`;
      if (userContext.profile.birth_date) {
        contextMessage += `- Doğum tarihi: ${userContext.profile.birth_date}\n`;
      }
      if (userContext.profile.zodiac_sign) {
        contextMessage += `- Burcu: ${userContext.profile.zodiac_sign}\n`;
      }
    }

    if (userContext.birthChart?.result) {
      const chart = userContext.birthChart.result;
      contextMessage += `- Doğum Haritası: ${JSON.stringify(chart).substring(0, 500)}...\n`;
    }

    if (userContext.numerology?.result) {
      contextMessage += `- Numeroloji: ${JSON.stringify(userContext.numerology.result).substring(0, 300)}...\n`;
    }

    if (userContext.recentTarot && userContext.recentTarot.length > 0) {
      contextMessage += `- Son Tarot Okumaları: ${userContext.recentTarot.length} adet\n`;
    }

    // Handle quick actions
    let userMessage = message;
    if (quickAction) {
      switch (quickAction) {
        case "daily_energy":
          userMessage = "Bugünkü enerjim nasıl? Günümü nasıl geçirmeliyim?";
          break;
        case "love_advice":
          userMessage = "Aşk hayatım hakkında ne söylersin? Bugün romantik konularda ne yapmalıyım?";
          break;
        case "career_guidance":
          userMessage = "Kariyer ve iş hayatım hakkında rehberlik eder misin?";
          break;
        case "draw_card":
          userMessage = "Benim için tek bir tarot kartı çek ve yorumla.";
          break;
      }
    }

    // Get or create conversation
    let activeConversationId = conversationId;
    
    if (!activeConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("oracle_conversations")
        .insert({ user_id: user.id, title: userMessage.substring(0, 50) })
        .select()
        .single();

      if (convError) throw convError;
      activeConversationId = newConv.id;
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("oracle_messages")
      .select("*")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    // Build messages array
    const messages = [
      { role: "system", content: MYSTIC_SYSTEM_PROMPT },
      { role: "system", content: contextMessage },
    ];

    // Add history
    if (history) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "oracle" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: userMessage });

    // Save user message
    await supabase.from("oracle_messages").insert({
      conversation_id: activeConversationId,
      role: "user",
      content: userMessage,
    });

    // Call AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek, lütfen bekleyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI servisi kullanılamıyor." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Update daily usage
    if (usageData) {
      await supabase
        .from("oracle_daily_usage")
        .update({
          free_questions_used: needsCredit ? freeQuestionsUsed : freeQuestionsUsed + 1,
          paid_questions_used: needsCredit ? (usageData.paid_questions_used || 0) + 1 : usageData.paid_questions_used,
        })
        .eq("user_id", user.id)
        .eq("date", today);
    } else {
      await supabase.from("oracle_daily_usage").insert({
        user_id: user.id,
        date: today,
        free_questions_used: needsCredit ? 0 : 1,
        paid_questions_used: needsCredit ? 1 : 0,
      });
    }

    // Create a transform stream to collect the full response for saving
    let fullResponse = "";
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        // Parse SSE to extract content
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
              }
            } catch {
              // ignore parsing errors
            }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Save oracle response after streaming completes
        if (fullResponse) {
          await supabase.from("oracle_messages").insert({
            conversation_id: activeConversationId,
            role: "oracle",
            content: fullResponse,
            context_used: userContext,
          });
        }
      },
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Conversation-Id": activeConversationId,
        "X-Free-Questions-Remaining": String(Math.max(0, FREE_QUESTIONS_PER_DAY - freeQuestionsUsed - (needsCredit ? 0 : 1))),
      },
    });

  } catch (error) {
    console.error("Oracle chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
