import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Video, Sparkles, Heart, Menu, Coffee, Moon, Hand, Star, Target, Calendar, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const quickMenuItems = [
    { icon: History, label: "Analiz Geçmişi", path: "/analysis-history" },
    { icon: Sparkles, label: "Tarot", path: "/tarot" },
    { icon: Coffee, label: "Kahve Falı", path: "/coffee-fortune" },
    { icon: Moon, label: "Rüya Tabiri", path: "/dream-interpretation" },
    { icon: Hand, label: "El Okuma", path: "/palmistry" },
    { icon: Star, label: "Günlük Burç", path: "/daily-horoscope" },
    { icon: Target, label: "Numeroloji", path: "/numerology" },
    { icon: Calendar, label: "Doğum Haritası", path: "/birth-chart" },
    { icon: FileText, label: "El Yazısı", path: "/handwriting" },
    { icon: Heart, label: "Uyumluluk", path: "/compatibility" },
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
              <Link key={item.path} to={item.path!} className="flex-1">
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
            <SheetContent side="bottom" className="h-[60vh]">
              <SheetHeader>
                <SheetTitle>Hızlı Erişim</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {quickMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setQuickMenuOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-accent transition-all"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs text-center font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Create Post Dialog */}
      <CreatePostDialog
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
    </>
  );
};