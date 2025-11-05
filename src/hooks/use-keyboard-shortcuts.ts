import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsProps {
  onNewPost?: () => void;
  onSearch?: () => void;
  onShowHelp?: () => void;
}

export const useKeyboardShortcuts = ({ 
  onNewPost, 
  onSearch,
  onShowHelp 
}: UseKeyboardShortcutsProps = {}) => {
  const navigate = useNavigate();

  // Track if we're in a sequence (like G+H)
  let lastKey = "";
  let lastKeyTime = 0;

  const shortcuts: KeyboardShortcut[] = [
    // Global shortcuts with Cmd/Ctrl
    {
      key: "k",
      ctrlKey: true,
      metaKey: true,
      callback: () => onSearch?.(),
      description: "Global arama",
      category: "Genel"
    },
    
    // Single key shortcuts
    {
      key: "n",
      callback: () => onNewPost?.(),
      description: "Yeni gönderi oluştur",
      category: "İçerik"
    },
    {
      key: "?",
      shiftKey: true,
      callback: () => onShowHelp?.(),
      description: "Kısayollar yardımı",
      category: "Genel"
    },
    
    // Navigation shortcuts with G prefix
    {
      key: "h",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/");
        }
      },
      description: "Ana sayfaya git (G+H)",
      category: "Navigasyon"
    },
    {
      key: "m",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/messages");
        } else {
          // Direct M key for messages
          navigate("/messages");
        }
      },
      description: "Mesajlara git (M veya G+M)",
      category: "Navigasyon"
    },
    {
      key: "p",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/profile");
        }
      },
      description: "Profilime git (G+P)",
      category: "Navigasyon"
    },
    {
      key: "f",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/friends");
        }
      },
      description: "Arkadaşlarım (G+F)",
      category: "Navigasyon"
    },
    {
      key: "e",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/explore");
        }
      },
      description: "Keşfet (G+E)",
      category: "Navigasyon"
    },
    {
      key: "r",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/reels");
        }
      },
      description: "Reels (G+R)",
      category: "Navigasyon"
    },
    {
      key: "s",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/settings");
        }
      },
      description: "Ayarlar (G+S)",
      category: "Navigasyon"
    },
    {
      key: "d",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/discovery");
        }
      },
      description: "Keşif (G+D)",
      category: "Navigasyon"
    },
    {
      key: "c",
      callback: () => {
        if (lastKey === "g" && Date.now() - lastKeyTime < 1000) {
          navigate("/match");
        }
      },
      description: "Eşleşme (G+C)",
      category: "Navigasyon"
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    
    // Track G key for sequences
    if (key === "g") {
      lastKey = "g";
      lastKeyTime = Date.now();
      return;
    }

    // Find matching shortcut
    const shortcut = shortcuts.find((s) => {
      const keyMatches = s.key === key;
      const ctrlMatches = s.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const metaMatches = s.metaKey ? event.metaKey || event.ctrlKey : true;
      const shiftMatches = s.shiftKey ? event.shiftKey : !event.shiftKey;

      return keyMatches && ctrlMatches && metaMatches && shiftMatches;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.callback();
      lastKey = "";
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};

// Export shortcuts info for help dialog
export const getShortcutsInfo = () => {
  return [
    {
      category: "Genel",
      shortcuts: [
        { keys: ["⌘/Ctrl", "K"], description: "Global arama" },
        { keys: ["?"], description: "Kısayollar yardımı" },
      ]
    },
    {
      category: "İçerik",
      shortcuts: [
        { keys: ["N"], description: "Yeni gönderi oluştur" },
      ]
    },
    {
      category: "Navigasyon",
      shortcuts: [
        { keys: ["G", "H"], description: "Ana sayfa" },
        { keys: ["M"], description: "Mesajlar" },
        { keys: ["G", "P"], description: "Profilim" },
        { keys: ["G", "F"], description: "Arkadaşlarım" },
        { keys: ["G", "E"], description: "Keşfet" },
        { keys: ["G", "R"], description: "Reels" },
        { keys: ["G", "D"], description: "Keşif" },
        { keys: ["G", "C"], description: "Eşleşme" },
        { keys: ["G", "S"], description: "Ayarlar" },
      ]
    }
  ];
};
