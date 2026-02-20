import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Generating friend suggestions for user:", user.id);

    // Get current user's profile with interests
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("interests, zodiac_sign, looking_for")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    // Get existing friends and pending requests
    const { data: existingConnections } = await supabase
      .from("friends")
      .select("friend_id, user_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    const connectedUserIds = new Set(
      existingConnections?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || []
    );

    // Get all other users
    const { data: potentialFriends, error: usersError } = await supabase
      .from("profiles")
      .select("user_id, username, interests, zodiac_sign, avatar_url")
      .neq("user_id", user.id);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    // Calculate compatibility scores
    const suggestions = potentialFriends
      ?.filter(profile => !connectedUserIds.has(profile.user_id))
      .map(profile => {
        let score = 0;
        const reasons: string[] = [];
        const commonInterests: string[] = [];

        // Calculate common interests (max 50 points)
        if (currentProfile.interests && profile.interests) {
          const common = currentProfile.interests.filter((interest: string) =>
            profile.interests?.includes(interest)
          );
          commonInterests.push(...common);
          score += Math.min(common.length * 10, 50);
          if (common.length > 0) {
            reasons.push(`${common.length} ortak ilgi alanı`);
          }
        }

        // Zodiac compatibility (max 30 points)
        if (currentProfile.zodiac_sign && profile.zodiac_sign) {
          const compatibleSigns = getCompatibleZodiacSigns(currentProfile.zodiac_sign);
          if (compatibleSigns.includes(profile.zodiac_sign)) {
            score += 30;
            reasons.push("Burç uyumu");
          }
        }

        // Looking for match (max 20 points)
        if (currentProfile.looking_for && profile.interests) {
          const lookingForMatch = currentProfile.looking_for.filter((item: string) =>
            profile.interests?.includes(item)
          );
          score += Math.min(lookingForMatch.length * 10, 20);
          if (lookingForMatch.length > 0) {
            reasons.push("İlgi alanları eşleşmesi");
          }
        }

        return {
          user_id: user.id,
          suggested_user_id: profile.user_id,
          compatibility_score: score,
          common_interests: commonInterests,
          reason: reasons.join(", ") || "Yeni arkadaş önerisi",
          profile: {
            username: profile.username,
            avatar_url: profile.avatar_url,
          }
        };
      })
      .filter(s => s.compatibility_score > 0)
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 10) || [];

    console.log(`Found ${suggestions.length} friend suggestions`);

    // Clear old suggestions and insert new ones
    await supabase
      .from("friend_suggestions")
      .delete()
      .eq("user_id", user.id);

    if (suggestions.length > 0) {
      const { error: insertError } = await supabase
        .from("friend_suggestions")
        .insert(
          suggestions.map(s => ({
            user_id: s.user_id,
            suggested_user_id: s.suggested_user_id,
            compatibility_score: s.compatibility_score,
            common_interests: s.common_interests,
            reason: s.reason,
          }))
        );

      if (insertError) {
        console.error("Error inserting suggestions:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: suggestions.length,
        suggestions: suggestions.map(s => ({
          ...s.profile,
          compatibility_score: s.compatibility_score,
          reason: s.reason,
        }))
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating friend suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getCompatibleZodiacSigns(sign: string): string[] {
  const compatibility: Record<string, string[]> = {
    "Koç": ["Aslan", "Yay", "İkizler", "Kova"],
    "Boğa": ["Başak", "Oğlak", "Yengeç", "Balık"],
    "İkizler": ["Terazi", "Kova", "Koç", "Aslan"],
    "Yengeç": ["Akrep", "Balık", "Boğa", "Başak"],
    "Aslan": ["Koç", "Yay", "İkizler", "Terazi"],
    "Başak": ["Boğa", "Oğlak", "Yengeç", "Akrep"],
    "Terazi": ["İkizler", "Kova", "Aslan", "Yay"],
    "Akrep": ["Yengeç", "Balık", "Başak", "Oğlak"],
    "Yay": ["Koç", "Aslan", "Terazi", "Kova"],
    "Oğlak": ["Boğa", "Başak", "Akrep", "Balık"],
    "Kova": ["İkizler", "Terazi", "Koç", "Yay"],
    "Balık": ["Yengeç", "Akrep", "Boğa", "Oğlak"],
  };

  return compatibility[sign] || [];
}