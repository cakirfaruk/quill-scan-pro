import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioUrl, translate, targetLanguage } = await req.json();
    
    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    console.log('Fetching audio from:', audioUrl);

    // Fetch the audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    const audioBlob = await audioResponse.blob();
    console.log('Audio blob size:', audioBlob.size);

    // Prepare form data for Whisper API - request verbose JSON to get language info
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json'); // Get language detection

    console.log('Sending to OpenAI Whisper API...');

    // Transcribe with OpenAI Whisper
    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcribeResult = await transcribeResponse.json();
    const transcribedText = transcribeResult.text;
    const detectedLanguage = transcribeResult.language; // e.g., "en", "tr", etc.

    console.log('Transcription successful:', transcribedText);
    console.log('Detected language:', detectedLanguage);

    // If translation is requested, use Lovable AI
    if (translate && targetLanguage) {
      console.log('Translating to:', targetLanguage);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

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

      const targetLangName = languageNames[targetLanguage] || 'Turkish';
      const systemPrompt = `You are a professional translator. Translate the given text to ${targetLangName}.
Only return the translated text, nothing else. Preserve formatting and special characters.`;

      const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcribedText }
          ],
        }),
      });

      if (!translateResponse.ok) {
        console.error('Translation failed:', translateResponse.status);
        // Return transcription even if translation fails
        return new Response(
          JSON.stringify({ 
            transcription: transcribedText,
            translation: null,
            sourceLanguage: detectedLanguage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const translateData = await translateResponse.json();
      const translatedText = translateData.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({ 
          transcription: transcribedText,
          translation: translatedText,
          sourceLanguage: detectedLanguage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        transcription: transcribedText,
        translation: null,
        sourceLanguage: detectedLanguage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
