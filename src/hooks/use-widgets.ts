import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Widget {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  category: "analysis" | "fortune" | "social";
  isPinned: boolean;
  order: number;
}

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "tarot",
    title: "Tarot Falı",
    description: "Kartlarla geleceğinize dair ipuçları",
    icon: "🔮",
    color: "from-violet-500 to-purple-500",
    path: "/tarot",
    category: "fortune",
    isPinned: true,
    order: 0,
  },
  {
    id: "coffee",
    title: "Kahve Falı",
    description: "Fincanınızdaki semboller ne söylüyor?",
    icon: "☕",
    color: "from-amber-600 to-yellow-600",
    path: "/coffee-fortune",
    category: "fortune",
    isPinned: true,
    order: 1,
  },
  {
    id: "match",
    title: "Eşleşme",
    description: "Ruhsal uyumlu kişileri keşfet",
    icon: "💕",
    color: "from-rose-500 to-red-500",
    path: "/match",
    category: "social",
    isPinned: true,
    order: 2,
  },
  {
    id: "dream",
    title: "Rüya Tabiri",
    description: "Rüyalarınızın gizli anlamlarını keşfedin",
    icon: "🌙",
    color: "from-indigo-500 to-blue-500",
    path: "/dream",
    category: "fortune",
    isPinned: false,
    order: 3,
  },
  {
    id: "palmistry",
    title: "El Okuma",
    description: "Avuç içinizde gizli sırlar",
    icon: "🤲",
    color: "from-teal-500 to-emerald-500",
    path: "/palmistry",
    category: "fortune",
    isPinned: false,
    order: 4,
  },
  {
    id: "daily-horoscope",
    title: "Günlük Kehanet",
    description: "Bugün sizi neler bekliyor?",
    icon: "⭐",
    color: "from-yellow-500 to-amber-500",
    path: "/daily-horoscope",
    category: "fortune",
    isPinned: false,
    order: 5,
  },
  {
    id: "handwriting",
    title: "El Yazısı Analizi",
    description: "Kişilik özelliklerinizi el yazınızdan keşfedin",
    icon: "✍️",
    color: "from-blue-500 to-cyan-500",
    path: "/handwriting",
    category: "analysis",
    isPinned: false,
    order: 6,
  },
  {
    id: "numerology",
    title: "Numeroloji",
    description: "İsim ve doğum tarihinizle sayıların gücünü keşfedin",
    icon: "🔢",
    color: "from-purple-500 to-pink-500",
    path: "/numerology",
    category: "analysis",
    isPinned: false,
    order: 7,
  },
  {
    id: "birth-chart",
    title: "Doğum Haritası",
    description: "Yıldızların size söylediklerini öğrenin",
    icon: "🌟",
    color: "from-amber-500 to-orange-500",
    path: "/birth-chart",
    category: "analysis",
    isPinned: false,
    order: 8,
  },
  {
    id: "compatibility",
    title: "Uyumluluk Analizi",
    description: "İki kişi arasındaki uyumu analiz edin",
    icon: "💕",
    color: "from-pink-500 to-rose-500",
    path: "/compatibility",
    category: "analysis",
    isPinned: false,
    order: 9,
  },
];

const STORAGE_KEY = "user-widgets";

export const useWidgets = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWidgets(parsed);
      } else {
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch (error) {
      console.error("Failed to load widgets:", error);
      setWidgets(DEFAULT_WIDGETS);
    }
  };

  const saveWidgets = (updatedWidgets: Widget[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWidgets));
      setWidgets(updatedWidgets);
    } catch (error) {
      console.error("Failed to save widgets:", error);
      toast.error("Widget ayarları kaydedilemedi");
    }
  };

  const togglePin = (widgetId: string) => {
    const updated = widgets.map((w) =>
      w.id === widgetId ? { ...w, isPinned: !w.isPinned } : w
    );
    saveWidgets(updated);
    toast.success(
      updated.find((w) => w.id === widgetId)?.isPinned
        ? "Widget sabitlendi"
        : "Widget sabitleme kaldırıldı"
    );
  };

  const reorderWidgets = (startIndex: number, endIndex: number) => {
    const result = Array.from(widgets);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reordered = result.map((widget, index) => ({
      ...widget,
      order: index,
    }));

    saveWidgets(reordered);
  };

  const resetWidgets = () => {
    saveWidgets(DEFAULT_WIDGETS);
    toast.success("Varsayılan ayarlara döndürüldü");
  };

  const getPinnedWidgets = () => {
    return widgets.filter((w) => w.isPinned).sort((a, b) => a.order - b.order);
  };

  return {
    widgets,
    pinnedWidgets: getPinnedWidgets(),
    togglePin,
    reorderWidgets,
    resetWidgets,
  };
};
