import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, type } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create a descriptive prompt for the OG image based on the analysis type
    const typePrompts: Record<string, string> = {
      tarot: 'A mystical tarot card reading scene with cosmic purple and gold gradients, featuring ornate tarot cards, celestial symbols, and magical auras. Modern and elegant design.',
      coffee: 'A Turkish coffee fortune telling scene with coffee cup, mystical symbols in coffee grounds, warm brown and gold tones, magical atmosphere. Modern and elegant design.',
      dream: 'A dreamy, ethereal scene with floating dream symbols, soft purple and blue gradients, mystical clouds, and cosmic elements. Modern and elegant design.',
      palmistry: 'A mystical palm reading scene with detailed hand lines glowing with cosmic energy, purple and gold magical symbols, elegant and modern design.',
      horoscope: 'Zodiac wheel with celestial bodies, cosmic purple and gold gradients, stars and constellations, mystical and modern design.',
      birthchart: 'Astrological birth chart with planets and houses, cosmic design with purple and gold gradients, celestial symbols, elegant and modern.',
      numerology: 'Sacred geometry and mystical numbers floating in cosmic space, purple and gold gradients, magical symbols, modern and elegant design.',
      compatibility: 'Two cosmic souls connecting through celestial energy, heart-shaped constellation, purple and gold romantic mystical design.',
      handwriting: 'Mystical handwriting analysis with elegant script and cosmic symbols, purple and gold gradients, magical aura, modern design.',
    };

    const imagePrompt = typePrompts[type] || 'Mystical astrology and fortune telling scene with cosmic purple and gold gradients, magical symbols, elegant and modern design.';
    
    // Add title overlay instruction
    const fullPrompt = `${imagePrompt} Include elegant text overlay at the top that says "${title}" in beautiful mystical font. Ultra high resolution, 16:9 aspect ratio social media image.`;

    console.log('Generating OG image with prompt:', fullPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-og-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
