import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MobileNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Ana Sayfa", path: "/" },
    { icon: Search, label: "Keşfet", path: "/explore" },
    { icon: Plus, label: "Oluştur", path: "/feed" },
    { icon: Video, label: "Reels", path: "/reels" },
    { icon: Sparkles, label: "Analizler", path: "/discovery" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-lg z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full flex flex-col items-center gap-0.5 h-auto py-1.5 transition-all ${
                  active 
                    ? "text-primary scale-105" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 transition-all ${active ? "fill-primary stroke-2" : ""}`} />
                <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};