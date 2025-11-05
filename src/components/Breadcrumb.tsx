import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  customHome?: { label: string; path: string };
}

export const Breadcrumb = ({ items, customHome }: BreadcrumbProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumb from path if not provided
  const generateBreadcrumb = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Map of route segments to readable labels
    const labelMap: Record<string, string> = {
      groups: "Gruplar",
      settings: "Ayarlar",
      profile: "Profil",
      messages: "Mesajlar",
      friends: "Arkadaşlar",
      saved: "Kaydedilenler",
      tarot: "Tarot",
      "coffee-fortune": "Kahve Falı",
      palmistry: "El Falı",
      handwriting: "El Yazısı",
      "birth-chart": "Doğum Haritası",
      numerology: "Numeroloji",
      compatibility: "Uyumluluk",
      "daily-horoscope": "Günlük Burç",
      dream: "Rüya Yorumu",
      reels: "Reels",
      explore: "Keşfet",
      discovery: "Keşif",
      match: "Eşleşme",
      "call-history": "Arama Geçmişi",
      about: "Hakkında",
      faq: "SSS",
      credits: "Krediler",
    };

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip dynamic IDs (UUIDs or usernames after certain paths)
      const isDynamicId = 
        segment.includes("-") && segment.length > 20 || // UUID-like
        (index > 0 && pathSegments[index - 1] === "groups") || // Group ID
        (index > 0 && pathSegments[index - 1] === "profile"); // Username

      if (!isDynamicId) {
        breadcrumbItems.push({
          label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
        });
      }
    });

    return breadcrumbItems;
  };

  const breadcrumbItems = generateBreadcrumb();
  const home = customHome || { label: "Ana Sayfa", path: "/" };

  // Don't show breadcrumb on home page
  if (location.pathname === "/" && !items) return null;

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(home.path)}
        className="h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-2 hover:bg-muted/50 transition-colors"
      >
        <Home className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{home.label}</span>
      </Button>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <div key={item.path} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-muted/50">
                {item.label}
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className="h-7 sm:h-8 px-2 sm:px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {item.label}
              </Button>
            )}
          </div>
        );
      })}
    </nav>
  );
};
