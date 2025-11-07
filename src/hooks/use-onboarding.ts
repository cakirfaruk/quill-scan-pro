import { useState, useEffect } from "react";

const ONBOARDING_KEY = "app-onboarding-completed";

export const useOnboarding = () => {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      setShouldShowOnboarding(!completed);
      setIsLoading(false);
    };

    checkOnboarding();
  }, []);

  const markOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShouldShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShouldShowOnboarding(true);
  };

  return {
    shouldShowOnboarding,
    isLoading,
    markOnboardingComplete,
    resetOnboarding,
  };
};
