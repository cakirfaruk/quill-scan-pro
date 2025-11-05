import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface ThemeSettings {
  fontSize: "small" | "medium" | "large";
  borderRadius: "sharp" | "default" | "round";
  accentColor: string;
  primaryColor: string;
  animationSpeed: "slow" | "normal" | "fast";
}

const DEFAULT_SETTINGS: ThemeSettings = {
  fontSize: "medium",
  borderRadius: "default",
  accentColor: "210 100% 50%",
  primaryColor: "217 91% 35%",
  animationSpeed: "normal",
};

const FONT_SIZE_MAP = {
  small: {
    base: "14px",
    scale: 0.875,
  },
  medium: {
    base: "16px",
    scale: 1,
  },
  large: {
    base: "18px",
    scale: 1.125,
  },
};

const BORDER_RADIUS_MAP = {
  sharp: "0.25rem",
  default: "0.75rem",
  round: "1.5rem",
};

const ANIMATION_SPEED_MAP = {
  slow: 0.5,
  normal: 0.3,
  fast: 0.15,
};

const STORAGE_KEY = "theme-settings";

export const useThemeSettings = () => {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        applySettings(parsed);
      } else {
        applySettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Failed to load theme settings:", error);
      applySettings(DEFAULT_SETTINGS);
    }
  };

  const applySettings = (newSettings: ThemeSettings) => {
    const root = document.documentElement;

    // Apply font size
    const fontSize = FONT_SIZE_MAP[newSettings.fontSize];
    root.style.setProperty("--font-size-base", fontSize.base);
    root.style.fontSize = fontSize.base;

    // Apply border radius
    root.style.setProperty("--radius", BORDER_RADIUS_MAP[newSettings.borderRadius]);

    // Apply accent color
    root.style.setProperty("--accent", newSettings.accentColor);

    // Apply primary color
    root.style.setProperty("--primary", newSettings.primaryColor);
    root.style.setProperty("--primary-glow", newSettings.primaryColor.replace(/(\d+)%/, (match, p1) => `${parseInt(p1) + 10}%`));

    // Apply animation speed
    const speed = ANIMATION_SPEED_MAP[newSettings.animationSpeed];
    root.style.setProperty("--transition-smooth", `all ${speed}s cubic-bezier(0.4, 0, 0.2, 1)`);
  };

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    applySettings(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success("Tema ayarları kaydedildi");
    } catch (error) {
      console.error("Failed to save theme settings:", error);
      toast.error("Tema ayarları kaydedilemedi");
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Tema ayarları sıfırlandı");
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
