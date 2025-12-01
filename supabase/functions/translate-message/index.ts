import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const languageNames: Record<string, string> = {
  'tr': 'Turkish',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'ar': 'Arabic',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'it': 'Italian'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage, detectLanguage = false } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // First, detect the language if requested
    let detectedLanguage = null;
    let needsTranslation = true;

    if (detectLanguage) {
      const detectPrompt = `Detect the language of the following text. Return ONLY the ISO 639-1 two-letter language code (e.g., "en" for English, "tr" for Turkish, "es" for Spanish, etc.). Return nothing else, just the two-letter code.

Text: ${text}`;

      const detectResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: detectPrompt }
          ],
        }),
      });

      if (!detectResponse.ok) {
        console.error("Language detection failed:", detectResponse.status);
      } else {
        const detectData = await detectResponse.json();
        detectedLanguage = detectData.choices?.[0]?.message?.content?.trim().toLowerCase();
        
        // Check if translation is needed
        if (detectedLanguage === targetLanguage) {
          needsTranslation = false;
        }
      }
    }

    // If no translation needed, return original text
    if (!needsTranslation && detectLanguage) {
      return new Response(
        JSON.stringify({ 
          translatedText: text,
          detectedLanguage,
          needsTranslation: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Translate the text
    const targetLangName = languageNames[targetLanguage || 'tr'] || 'Turkish';
    const systemPrompt = `You are a professional translator. Translate the given text to ${targetLangName}.
Only return the translated text, nothing else. Preserve formatting, emojis, and special characters.
If the text is already in ${targetLangName}, return it as is.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Ödeme gerekli. Lütfen Lovable AI çalışma alanınıza kredi ekleyin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Çeviri hatası" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content;

    if (!translatedText) {
      throw new Error("No translation returned");
    }

    return new Response(
      JSON.stringify({ 
        translatedText,
        detectedLanguage,
        needsTranslation: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
