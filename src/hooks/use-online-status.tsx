import { useEffect, useState } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL_MS = 120_000;

export const useOnlineStatus = (userId: string | null) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    void loadStatus();

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

    const { data, error } = await supabase
      .from("profiles")
      .select("is_online, last_seen")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to load online status", error);
      return;
    }

    if (data) {
      setIsOnline(data.is_online || false);
      setLastSeen(data.last_seen);
    }
  };

  return { isOnline, lastSeen };
};

export const useUpdateOnlineStatus = () => {
  useEffect(() => {
    let intervalId: number | undefined;
    let cachedUserId: string | null = null;
    let cachedAccessToken: string | null = null;

    const loadAuthContext = async () => {
      if (cachedUserId) return { userId: cachedUserId, accessToken: cachedAccessToken };

      const [userResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      const userError = userResult.error;
      const sessionError = sessionResult.error;

      if (userError || sessionError) {
        console.error("Unable to fetch auth context for status updates", userError ?? sessionError);
        return null;
      }

      const userId = userResult.data.user?.id ?? null;
      if (!userId) {
        return null;
      }

      cachedUserId = userId;
      cachedAccessToken = sessionResult.data.session?.access_token ?? null;

      return { userId, accessToken: cachedAccessToken };
    };

    const updateStatus = async (online: boolean, { keepalive = false } = {}) => {
      const authContext = await loadAuthContext();
      if (!authContext) return;

      const payload = {
        is_online: online,
        last_seen: new Date().toISOString(),
      };

      if (keepalive && typeof fetch !== "undefined") {
        const headers: HeadersInit = {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        };

        if (authContext.accessToken) {
          headers.Authorization = `Bearer ${authContext.accessToken}`;
        }

        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${authContext.userId}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify(payload),
              keepalive: true,
            }
          );

          if (!response.ok) {
            console.error("Failed to update online status (keepalive)", response.statusText);
          }
        } catch (error) {
          console.error("Failed to update online status (keepalive)", error);
        }

        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", authContext.userId);

      if (error) {
        console.error("Failed to update online status", error);
      }
    };

    const startHeartbeat = () => {
      if (intervalId || document.visibilityState !== "visible" || !navigator.onLine) return;

      void updateStatus(true);
      intervalId = window.setInterval(() => {
        void updateStatus(true);
      }, HEARTBEAT_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        stopHeartbeat();
        void updateStatus(false);
      }
    };

    const handleOnline = () => {
      startHeartbeat();
    };

    const handleOffline = () => {
      stopHeartbeat();
      void updateStatus(false);
    };

    const handleBeforeUnload = () => {
      stopHeartbeat();
      void updateStatus(false, { keepalive: true });
    };

    startHeartbeat();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void updateStatus(false);
    };
  }, []);
};
