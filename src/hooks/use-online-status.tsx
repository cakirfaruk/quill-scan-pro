import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOnlineStatus = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Set user online when component mounts
    const setOnline = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("user_id", userId);
    };

    // Set user offline when component unmounts or page closes
    const setOffline = async () => {
      await supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("user_id", userId);
    };

    setOnline();

    // Update last_seen every 30 seconds
    const interval = setInterval(async () => {
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", userId);
    }, 30000);

    // Set offline on beforeunload
    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, [userId]);
};
