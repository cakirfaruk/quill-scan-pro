import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    // Fetch user's posts (last 10)
    const { data: posts } = await supabaseClient
      .from("posts")
      .select("content, created_at, media_type")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch user's analyses
    const analyses: any[] = [];
    
    // Birth chart
    const { data: birthCharts } = await supabaseClient
      .from("birth_chart_analyses")
      .select("result, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (birthCharts && birthCharts.length > 0) {
      analyses.push({ type: "birth_chart", ...birthCharts[0] });
    }

    // Numerology
    const { data: numerology } = await supabaseClient
      .from("numerology_analyses")
      .select("result, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (numerology && numerology.length > 0) {
      analyses.push({ type: "numerology", ...numerology[0] });
    }

    // Tarot
    const { data: tarot } = await supabaseClient
      .from("tarot_readings")
      .select("interpretation, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(2);
    if (tarot) {
      tarot.forEach(t => analyses.push({ type: "tarot", result: t.interpretation, created_at: t.created_at }));
    }

    // Dream interpretations
    const { data: dreams } = await supabaseClient
      .from("dream_interpretations")
      .select("interpretation, dream_description, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (dreams) {
      dreams.forEach(d => analyses.push({ type: "dream", result: d.interpretation, description: d.dream_description, created_at: d.created_at }));
    }

    // Fetch friends count
    const { count: friendsCount } = await supabaseClient
      .from("friends")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`)
      .eq("status", "accepted");

    // Prepare data summary for AI
    const profileSummary = {
      username: profile?.username,
      fullName: profile?.full_name,
      bio: profile?.bio,
      gender: profile?.gender,
      birthDate: profile?.birth_date,
      friendsCount: friendsCount || 0,
      postsCount: posts?.length || 0,
      recentPosts: posts?.slice(0, 5).map((p: any) => p.content).filter(Boolean),
      hasAnalyses: analyses.length > 0,
      analysesTypes: [...new Set(analyses.map(a => a.type))],
    };

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Sen bir kişilik analizi uzmanısın. Aşağıdaki kullanıcı bilgilerini analiz et ve detaylı bir profil analizi yap. Türkçe olarak yaz.

Kullanıcı Bilgileri:
- Kullanıcı Adı: ${profileSummary.username}
- İsim: ${profileSummary.fullName || "Belirtilmemiş"}
- Bio: ${profileSummary.bio || "Bio yok"}
- Cinsiyet: ${profileSummary.gender || "Belirtilmemiş"}
- Arkadaş Sayısı: ${profileSummary.friendsCount}
- Paylaşım Sayısı: ${profileSummary.postsCount}
${profileSummary.recentPosts && profileSummary.recentPosts.length > 0 ? `- Son Paylaşımlar: ${profileSummary.recentPosts.join(", ")}` : ""}
- Yaptığı Analiz Türleri: ${profileSummary.analysesTypes.join(", ") || "Henüz analiz yok"}

Lütfen aşağıdaki başlıklar altında detaylı bir analiz yap:

1. 📊 **Genel Profil Değerlendirmesi** - Kullanıcının sosyal medya varlığı ve aktivitesi hakkında genel izlenimler

2. 💫 **Kişilik Özellikleri** - Paylaşımlar, bio ve diğer bilgilerden çıkarılabilecek kişilik özellikleri

3. 🎭 **İlgi Alanları ve Hobiler** - Kullanıcının ilgi duyduğu konular ve hobiler

4. 🌟 **Sosyal Etkileşim Tarzı** - Nasıl iletişim kurduğu ve sosyalleşme tarzı

5. 🔮 **Mistik ve Ruhani İlgiler** - Yaptığı analizlere göre mistik konulara ilgisi

6. 💡 **Güçlü Yönler** - Bu kişinin öne çıkan pozitif özellikleri

7. 🎯 **Gelişim Alanları** - İyileştirilebilecek veya geliştirebileceği yönler

8. 🌈 **Özet ve Tavsiyeler** - Genel bir özet ve kişiye özel tavsiyeler

Her bölümü detaylı ve samimi bir dille yaz. Pozitif ve yapıcı ol.`;

    const aiResponse = await fetch("https://api.lovable.app/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API Error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Calculate credits (50 credits for profile analysis)
    const creditsUsed = 50;

    // Check if user has enough credits
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (!profileData || profileData.credits < creditsUsed) {
      throw new Error("Yetersiz kredi. Profil analizi için 50 kredi gereklidir.");
    }

    // Deduct credits
    await supabaseClient
      .from("profiles")
      .update({ credits: profileData.credits - creditsUsed })
      .eq("user_id", user.id);

    // Log credit transaction
    await supabaseClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsUsed,
      transaction_type: "profile_analysis",
      description: "Profil analizi yapıldı",
    });

    return new Response(
      JSON.stringify({
        analysis,
        creditsUsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-user-profile:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
