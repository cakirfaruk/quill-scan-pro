import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logger = createLogger('analyze-user-profile');

Deno.serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logger.success({ requestId, action: 'request_received' });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      await logger.error('Authentication error', { requestId, error: authError });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      await logger.error('No user found', { requestId });
      throw new Error("Not authenticated");
    }
    logger.success({ requestId, action: 'user_authenticated', userId: user.id });

    const { userId } = await req.json();
    const targetUserId = userId || user.id;
    logger.success({ requestId, action: 'target_user_identified', targetUserId });

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();
    
    if (profileError) {
      await logger.error('Error fetching profile', { requestId, userId: user.id, targetUserId, error: profileError });
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }
    logger.success({ requestId, action: 'profile_fetched', username: profile?.username });

    // Fetch user's posts (last 10)
    const { data: posts, error: postsError } = await supabaseClient
      .from("posts")
      .select("content, created_at, media_type")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (postsError) {
      await logger.warning('Error fetching posts (non-critical)', { requestId, targetUserId, error: postsError });
    } else {
      logger.success({ requestId, action: 'posts_fetched', count: posts?.length || 0 });
    }

    // Fetch user's analyses
    logger.success({ requestId, action: 'fetching_analyses', targetUserId });
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

    logger.success({ requestId, action: 'analyses_collected', count: analyses.length });

    // Fetch friends count
    const { count: friendsCount, error: friendsError } = await supabaseClient
      .from("friends")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`)
      .eq("status", "accepted");
    
    if (friendsError) {
      await logger.warning('Error fetching friends (non-critical)', { requestId, targetUserId, error: friendsError });
    } else {
      logger.success({ requestId, action: 'friends_count_fetched', count: friendsCount || 0 });
    }

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
    logger.success({ requestId, action: 'calling_ai', targetUserId });
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      await logger.error('LOVABLE_API_KEY not configured', { requestId });
      throw new Error("AI service not configured");
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
      await logger.error('AI API Error', { 
        requestId, 
        userId: user.id,
        status: aiResponse.status,
        error: errorText
      });
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;
    logger.success({ requestId, action: 'ai_analysis_completed', userId: user.id });

    // Calculate credits (50 credits for profile analysis)
    const creditsUsed = 50;
    logger.success({ requestId, action: 'checking_credits', userId: user.id, required: creditsUsed });

    // Check if user has enough credits
    const { data: profileData, error: creditCheckError } = await supabaseClient
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (creditCheckError) {
      await logger.error('Error checking credits', { requestId, userId: user.id, error: creditCheckError });
      throw new Error(`Failed to check credits: ${creditCheckError.message}`);
    }

    if (!profileData || profileData.credits < creditsUsed) {
      await logger.warning('Insufficient credits', { requestId, userId: user.id, available: profileData?.credits || 0, required: creditsUsed });
      throw new Error("Yetersiz kredi. Profil analizi için 50 kredi gereklidir.");
    }
    logger.success({ requestId, action: 'credits_verified', userId: user.id, credits: profileData.credits });

    // Deduct credits
    const { error: deductError } = await supabaseClient
      .from("profiles")
      .update({ credits: profileData.credits - creditsUsed })
      .eq("user_id", user.id);

    // Log credit transaction
    const { error: transactionError } = await supabaseClient.from("credit_transactions").insert({
      user_id: user.id,
      amount: -creditsUsed,
      transaction_type: "profile_analysis",
      description: "Profil analizi yapıldı",
    });

    if (transactionError) {
      await logger.warning('Error logging transaction (non-critical)', { requestId, userId: user.id, error: transactionError });
    } else {
      logger.success({ requestId, action: 'transaction_logged', userId: user.id });
    }

    const duration = performance.now() - startTime;
    logger.performance(duration, true);
    logger.success({ 
      requestId, 
      action: 'request_completed',
      userId: user.id,
      duration: `${duration.toFixed(2)}ms` 
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
    const duration = performance.now() - startTime;
    await logger.critical(error as Error, {
      requestId,
      duration: `${duration.toFixed(2)}ms`
    });
    logger.performance(duration, false, (error as Error).constructor.name);
    
    // Determine user-friendly error message
    let userMessage = 'İşlem başarısız oldu. Lütfen tekrar deneyin.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Yetersiz kredi')) {
        userMessage = error.message;
        statusCode = 400;
      } else if (error.message.includes('authenticated')) {
        userMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        statusCode = 401;
      } else if (error.message.includes('AI')) {
        userMessage = 'Yapay zeka servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
        statusCode = 503;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
