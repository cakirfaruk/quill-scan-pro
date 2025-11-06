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
    let userId: string | null = null;
    let isUpdating = false;

    const updateStatus = async (online: boolean) => {
      if (isUpdating) return; // Eğer zaten güncelleme yapılıyorsa çık
      isUpdating = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        userId = user.id;

        await supabase
          .from("profiles")
          .update({
            is_online: online,
            last_seen: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } finally {
        isUpdating = false;
      }
    };

    // İLK yükleme: Online yap
    updateStatus(true);

    // SADECE sayfa kapatılırken offline yap - 30 saniyede bir güncelleme YOK!
    const handleBeforeUnload = () => {
      if (userId) {
        // Sync call for beforeunload
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
          JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus(false);
      } else {
        updateStatus(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateStatus(false);
    };
  }, []);
};
