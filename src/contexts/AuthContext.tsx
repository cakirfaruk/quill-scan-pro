import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, full_name, profile_photo, credits")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    if (profileResult.data) {
      setProfile({
        username: profileResult.data.username,
        full_name: profileResult.data.full_name,
        profile_photo: profileResult.data.profile_photo,
        credits: profileResult.data.credits,
      });
    }
    setIsAdmin(!!roleResult.data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfileAndRole(user.id);
    }
  }, [user?.id, fetchProfileAndRole]);

  useEffect(() => {
    // NON-BLOCKING: getSession() reads from localStorage (instant, no network call)
    // This unblocks rendering immediately instead of waiting 500-1500ms for getUser()
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setIsLoading(false); // Unblock render IMMEDIATELY

      // Fetch profile/role in background (non-blocking, UI renders without waiting)
      if (sessionUser) {
        fetchProfileAndRole(sessionUser.id);
      }
    });

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          fetchProfileAndRole(newUser.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRole]);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
