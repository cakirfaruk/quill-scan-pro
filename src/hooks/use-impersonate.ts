import { useState, useEffect } from "react";

const IMPERSONATE_KEY = "impersonatedUserId";

export const useImpersonate = () => {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(
    localStorage.getItem(IMPERSONATE_KEY)
  );

  const startImpersonation = (userId: string) => {
    localStorage.setItem(IMPERSONATE_KEY, userId);
    setImpersonatedUserId(userId);
    // Reload to apply impersonation across all components
    window.location.href = "/profile";
  };

  const stopImpersonation = () => {
    localStorage.removeItem(IMPERSONATE_KEY);
    setImpersonatedUserId(null);
    window.location.href = "/admin";
  };

  const getEffectiveUserId = (actualUserId: string | undefined): string | undefined => {
    return impersonatedUserId || actualUserId;
  };

  const isImpersonating = !!impersonatedUserId;

  return {
    impersonatedUserId,
    startImpersonation,
    stopImpersonation,
    getEffectiveUserId,
    isImpersonating,
  };
};
