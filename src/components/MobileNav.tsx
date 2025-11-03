import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MobileNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Ana Sayfa", path: "/" },
    { icon: Search, label: "Keşfet", path: "/explore" },
    { icon: Plus, label: "Oluştur", path: "/feed" },
    { icon: MessageCircle, label: "Mesajlar", path: "/messages" },
    { icon: User, label: "Profil", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full flex flex-col items-center gap-1 h-auto py-2 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "fill-primary" : ""}`} />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};