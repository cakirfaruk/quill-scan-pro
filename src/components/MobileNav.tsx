import { useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Video, Sparkles, Heart, Menu, Coffee, Moon, Hand, Star, Target, Calendar, FileText, History, Gift, Users, Trophy, Award, Settings, User, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreloadLink } from "@/components/PreloadLink";
import { useState, useEffect, Suspense } from "react";
import { LazyCreatePostDialog } from "@/utils/lazyImports";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Separator } from "@/components/ui/separator";

export const MobileNav = () => {
  const location = useLocation();
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentProfile, setCurrentProfile] = useState<{ username: string; profile_photo: string | null }>({ username: "", profile_photo: null });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, profile_photo")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profileData) {
      setCurrentProfile(profileData);
    }
  };

  const handleCreatePost = () => {
    if (!userId) {
      toast({
        title: "Hata",
        description: "Lütfen giriş yapın",
        variant: "destructive",
      });
      return;
    }
    setCreatePostDialogOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Ana Sayfa", path: "/feed" },
    { icon: Heart, label: "Eşleşme", path: "/match" },
    { icon: Plus, label: "Oluştur", action: handleCreatePost },
    { icon: Video, label: "Reels", path: "/reels" },
  ];

  // Organized quick menu with categories for better navigation
  const quickMenuCategories = [
    {
      title: "Hızlı Erişim",
      items: [
        { icon: Gift, label: "Günlük Ödüller", path: "/daily-rewards", highlight: true },
        { icon: Sparkles, label: "Oracle AI", path: "/oracle", highlight: true },
        { icon: Star, label: "Mağaza", path: "/store", highlight: true },
        { icon: User, label: "Profil", path: "/profile" },
        { icon: MessageCircle, label: "Mesajlar", path: "/messages" },
      ]
    },
    {
      title: "Analizler",
      items: [
        { icon: History, label: "Analiz Geçmişi", path: "/analysis-history" },
        { icon: Sparkles, label: "Tarot", path: "/tarot" },
        { icon: Coffee, label: "Kahve Falı", path: "/coffee-fortune" },
        { icon: Moon, label: "Rüya Tabiri", path: "/dream" },
        { icon: Hand, label: "El Okuma", path: "/palmistry" },
        { icon: Star, label: "Günlük Burç", path: "/daily-horoscope" },
        { icon: Target, label: "Numeroloji", path: "/numerology" },
        { icon: Calendar, label: "Doğum Haritası", path: "/birth-chart" },
        { icon: FileText, label: "El Yazısı", path: "/handwriting" },
        { icon: Heart, label: "Uyumluluk", path: "/compatibility" },
      ]
    },
    {
      title: "Sosyal",
      items: [
        { icon: Users, label: "Gruplar", path: "/groups" },
        { icon: Search, label: "Keşfet", path: "/explore" },
        { icon: Trophy, label: "Lider Tablosu", path: "/leaderboard" },
        { icon: Award, label: "Rozetler", path: "/badges" },
      ]
    },
    {
      title: "Diğer",
      items: [
        { icon: Settings, label: "Ayarlar", path: "/settings" },
      ]
    }
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-lg z-50 lg:hidden">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;
            
            if (item.action) {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  onClick={item.action}
                  className="flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 transition-all text-muted-foreground hover:text-foreground"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">
                    {item.label}
                  </span>
                </Button>
              );
            }
            
            return (
              <PreloadLink key={item.path} to={item.path!} className="flex-1">
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
              </PreloadLink>
            );
          })}
          
          {/* Quick Menu */}
          <Sheet open={quickMenuOpen} onOpenChange={setQuickMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 transition-all text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">Menü</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle>Hızlı Erişim</SheetTitle>
              </SheetHeader>
              
              {/* PWA Install Button */}
              <div className="px-4 pb-2">
                <PWAInstallButton />
              </div>
              
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="px-4 pb-4 space-y-4">
                  {quickMenuCategories.map((category, categoryIndex) => (
                    <div key={category.title}>
                      {categoryIndex > 0 && <Separator className="mb-3" />}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {category.title}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isHighlight = 'highlight' in item && item.highlight;
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setQuickMenuOpen(false);
                              }}
                              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                                isHighlight 
                                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10" 
                                  : "hover:border-primary hover:bg-accent"
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                isHighlight ? "bg-primary/20" : "bg-primary/10"
                              }`}>
                                <Icon className={`w-4 h-4 ${isHighlight ? "text-primary" : "text-primary"}`} />
                              </div>
                              <span className="text-[10px] text-center font-medium leading-tight">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Create Post Dialog */}
      <Suspense fallback={<div />}>
        <LazyCreatePostDialog
          open={createPostDialogOpen}
          onOpenChange={setCreatePostDialogOpen}
          userId={userId}
          username={currentProfile.username}
          profilePhoto={currentProfile.profile_photo}
          onPostCreated={() => {
            toast({
              title: "Başarılı",
              description: "Gönderi oluşturuldu",
            });
            setCreatePostDialogOpen(false);
          }}
        />
      </Suspense>
    </>
  );
};