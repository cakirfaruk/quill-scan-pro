import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface PageHistoryItem {
  path: string;
  title: string;
  timestamp: number;
  icon?: string;
}

const MAX_HISTORY_ITEMS = 15;
const STORAGE_KEY = "page-history";

// Page title and icon mappings
const PAGE_CONFIG: Record<string, { title: string; icon: string }> = {
  "/": { title: "Ana Sayfa", icon: "🏠" },
  "/feed": { title: "Akış", icon: "📰" },
  "/messages": { title: "Mesajlar", icon: "💬" },
  "/profile": { title: "Profil", icon: "👤" },
  "/settings": { title: "Ayarlar", icon: "⚙️" },
  "/discovery": { title: "Keşfet", icon: "🔍" },
  "/match": { title: "Eşleşme", icon: "💕" },
  "/friends": { title: "Arkadaşlar", icon: "👥" },
  "/groups": { title: "Gruplar", icon: "👨‍👩‍👧‍👦" },
  "/explore": { title: "Keşfet", icon: "🌍" },
  "/reels": { title: "Reels", icon: "🎬" },
  "/saved": { title: "Kaydedilenler", icon: "🔖" },
  "/tarot": { title: "Tarot Falı", icon: "🔮" },
  "/coffee-fortune": { title: "Kahve Falı", icon: "☕" },
  "/dream": { title: "Rüya Tabiri", icon: "🌙" },
  "/palmistry": { title: "El Okuma", icon: "🤲" },
  "/daily-horoscope": { title: "Günlük Kehanet", icon: "⭐" },
  "/handwriting": { title: "El Yazısı Analizi", icon: "✍️" },
  "/numerology": { title: "Numeroloji", icon: "🔢" },
  "/birth-chart": { title: "Doğum Haritası", icon: "🌟" },
  "/compatibility": { title: "Uyumluluk Analizi", icon: "💞" },
  "/about": { title: "Hakkımızda", icon: "ℹ️" },
  "/faq": { title: "S.S.S.", icon: "❓" },
  "/credits": { title: "Kredi", icon: "💰" },
  "/call-history": { title: "Arama Geçmişi", icon: "📞" },
};

const getPageInfo = (pathname: string): { title: string; icon: string } => {
  // Check for dynamic routes
  if (pathname.startsWith("/group/")) {
    return { title: "Grup Sohbeti", icon: "👨‍👩‍👧‍👦" };
  }
  if (pathname.startsWith("/profile/")) {
    return { title: "Kullanıcı Profili", icon: "👤" };
  }
  
  // Return configured page or default
  return PAGE_CONFIG[pathname] || { title: pathname, icon: "📄" };
};

export const usePageHistory = () => {
  const location = useLocation();
  const [history, setHistory] = useState<PageHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Track page visits
  useEffect(() => {
    // Don't track auth page
    if (location.pathname === "/auth" || location.pathname === "/not-found") {
      return;
    }

    addToHistory(location.pathname);
  }, [location.pathname]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load page history:", error);
    }
  };

  const addToHistory = (pathname: string) => {
    const pageInfo = getPageInfo(pathname);
    
    const newItem: PageHistoryItem = {
      path: pathname,
      title: pageInfo.title,
      icon: pageInfo.icon,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.path !== pathname);
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save page history:", error);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const removeItem = (path: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.path !== path);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to update page history:", error);
      }
      return updated;
    });
  };

  return {
    history,
    clearHistory,
    removeItem,
  };
};
