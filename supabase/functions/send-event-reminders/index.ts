import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Database {
  public: {
    Tables: {
      group_events: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          event_date: string;
          location: string | null;
        };
      };
      event_participants: {
        Row: {
          event_id: string;
          user_id: string;
          status: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          username: string;
        };
      };
      notifications: {
        Insert: {
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string;
          reference_id?: string;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get events happening in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .from("group_events")
      .select("id, group_id, title, event_date, location")
      .gte("event_date", now.toISOString())
      .lte("event_date", tomorrow.toISOString());

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming events`);

    // For each event, get participants and send notifications
    for (const event of upcomingEvents || []) {
      const { data: participants, error: participantsError } =
        await supabaseClient
          .from("event_participants")
          .select("user_id, status")
          .eq("event_id", event.id)
          .in("status", ["going", "maybe"]);

      if (participantsError) {
        console.error(
          `Error fetching participants for event ${event.id}:`,
          participantsError
        );
        continue;
      }

      console.log(
        `Event ${event.title} has ${participants?.length || 0} participants`
      );

      // Send notification to each participant
      for (const participant of participants || []) {
        const eventDate = new Date(event.event_date);
        const hoursUntil = Math.round(
          (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        const { error: notificationError } = await supabaseClient
          .from("notifications")
          .insert({
            user_id: participant.user_id,
            type: "event_reminder",
            title: "Etkinlik Hatırlatması",
            message: `"${event.title}" etkinliği ${hoursUntil} saat sonra başlıyor${
              event.location ? ` - ${event.location}` : ""
            }`,
            link: `/groups/${event.group_id}`,
            reference_id: event.id,
          });

        if (notificationError) {
          console.error(
            `Error creating notification for user ${participant.user_id}:`,
            notificationError
          );
        } else {
          console.log(
            `Notification sent to user ${participant.user_id} for event ${event.title}`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: upcomingEvents?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-event-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
