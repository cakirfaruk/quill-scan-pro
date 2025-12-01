import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { createLogger } from '../_shared/logger.ts';

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

    console.log("Checking for scheduled messages...");

    // Get messages that should be sent
    const { data: scheduledMessages, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select("*")
      .lte("scheduled_for", new Date().toISOString())
      .eq("sent", false);

    if (fetchError) {
      console.error("Error fetching scheduled messages:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledMessages?.length || 0} messages to send`);

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No messages to send", count: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Send each message
    for (const scheduled of scheduledMessages) {
      try {
        // Insert into messages table
        const { error: insertError } = await supabase
          .from("messages")
          .insert({
            sender_id: scheduled.sender_id,
            receiver_id: scheduled.receiver_id,
            content: scheduled.content,
          });

        if (insertError) {
          console.error("Error sending message:", insertError);
          continue;
        }

        // Mark as sent
        const { error: updateError } = await supabase
          .from("scheduled_messages")
          .update({ sent: true, updated_at: new Date().toISOString() })
          .eq("id", scheduled.id);

        if (updateError) {
          console.error("Error updating scheduled message:", updateError);
        }

        console.log(`Sent scheduled message: ${scheduled.id}`);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Scheduled messages processed",
        count: scheduledMessages.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-scheduled-messages:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});