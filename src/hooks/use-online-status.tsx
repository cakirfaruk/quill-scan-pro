import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOnlineStatus = (userId: string | null) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Load initial status
    loadStatus();

    // Subscribe to status changes
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setIsOnline(payload.new.is_online);
          setLastSeen(payload.new.last_seen);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadStatus = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("is_online, last_seen")
      .eq("user_id", userId)
      .single();

    if (data) {
      setIsOnline(data.is_online || false);
      setLastSeen(data.last_seen);
    }
  };

  return { isOnline, lastSeen };
};

export const useUpdateOnlineStatus = () => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let userId: string | null = null;

    const updateStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userId = user.id;

      await supabase
        .from("profiles")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    };

    const setOffline = async () => {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      await supabase
        .from("profiles")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", userId);
    };

    // Update status immediately and then every 30 seconds
    updateStatus();
    intervalId = setInterval(updateStatus, 30000);

    // Set offline when leaving page
    const handleBeforeUnload = () => {
      setOffline();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        updateStatus();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setOffline();
    };
  }, []);
};
