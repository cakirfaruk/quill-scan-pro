import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Search, Plus, Video, Sparkles, Shield, Coins, MessageCircle, Menu, Heart, History
} from "lucide-react";
import { PreloadLink } from "@/components/PreloadLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { PageHistory } from "@/components/PageHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { LazyCreatePostDialog } from "@/utils/lazyImports";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useScrollProgress } from "@/hooks/use-parallax";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export const CompactHeader = () => {
  const [credits, setCredits] = useState(0);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const scrollProgress = useScrollProgress();
  const { scrollDirection, scrollY } = useScrollDirection({ threshold: 10 });
  
  // Mini mode when scrolled past 100px
  const isMiniMode = scrollY > 100;
  // Hide when scrolling down past 200px
  const shouldHide = scrollDirection === "down" && scrollY > 200;

  useUpdateOnlineStatus();

  useEffect(() => {
    loadUserProfile();

    const channel = supabase
      .channel("profile-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadUserProfile)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, username, profile_photo")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setCredits(profile.credits);
        setUsername(profile.username);
        setProfilePhoto(profile.profile_photo || "");
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roles);
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUserId(undefined);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Çıkış yapıldı", description: "Başarıyla çıkış yaptınız." });
    navigate("/auth");
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-[60] transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />
      
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          shouldHide && "-translate-y-full"
        )}
        style={{
          backgroundColor: scrollY > 5 
            ? `hsl(var(--card) / ${Math.min(0.95 + (scrollY / 1000), 0.98)})` 
            : 'hsl(var(--card) / 0.95)',
          backdropFilter: scrollY > 5 ? `blur(${Math.min(8 + scrollY / 50, 16)}px)` : 'blur(8px)',
          boxShadow: scrollY > 10 
            ? `0 4px 20px hsl(var(--primary) / ${Math.min(0.1 + scrollY / 2000, 0.2)})` 
            : '0 1px 3px hsl(var(--border) / 0.5)',
        }}
      >
        <div className="border-b border-border">
          <div 
            className={cn(
              "container mx-auto px-3 sm:px-4 flex items-center justify-between transition-all duration-300",
              isMiniMode ? "h-12" : "h-14"
            )}
          >
        {/* Logo */}
        <PreloadLink 
          to="/" 
          className={cn(
            "flex items-center gap-2 hover:opacity-80 transition-all duration-300",
            isMiniMode && "scale-90"
          )}
        >
          <div 
            className={cn(
              "p-1.5 bg-gradient-primary rounded-lg shadow-glow transition-all duration-300",
              isMiniMode && "p-1"
            )}
          >
            <Sparkles className={cn(
              "text-primary-foreground transition-all duration-300",
              isMiniMode ? "w-4 h-4" : "w-5 h-5"
            )} />
          </div>
          <span 
            className={cn(
              "font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block transition-all duration-300",
              isMiniMode ? "text-base" : "text-lg"
            )}
          >
            KAM
          </span>
        </PreloadLink>

        {/* Global Search - Centered */}
        {isLoggedIn && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <GlobalSearch />
          </div>
        )}

        {/* Desktop Navigation - Hidden on mobile */}
        {isLoggedIn && (
          <nav className="hidden lg:flex items-center gap-1">
            <PreloadLink to="/explore">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/explore" ? "text-primary" : ""}`}
              >
                <Search className="w-4 h-4" />
                Keşfet
              </Button>
            </PreloadLink>
            <PreloadLink to="/messages">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/messages" ? "text-primary" : ""}`}
              >
                <MessageCircle className="w-4 h-4" />
                Mesajlar
              </Button>
            </PreloadLink>
            <PreloadLink to="/match">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/match" ? "text-primary" : ""}`}
              >
                <Heart className="w-4 h-4" />
                Eşleşme
              </Button>
            </PreloadLink>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreatePostDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Oluştur
            </Button>
            <PreloadLink to="/reels">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/reels" ? "text-primary" : ""}`}
              >
                <Video className="w-4 h-4" />
                Reels
              </Button>
            </PreloadLink>
            <PreloadLink to="/discovery">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/discovery" ? "text-primary" : ""}`}
              >
                <Sparkles className="w-4 h-4" />
                Analizler
              </Button>
            </PreloadLink>
            <PreloadLink to="/analysis-history">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/analysis-history" ? "text-primary" : ""}`}
              >
                <History className="w-4 h-4" />
                Geçmiş
              </Button>
            </PreloadLink>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isLoggedIn ? (
            <>
              {/* Credits */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/credits")}
                className={cn(
                  "gap-1.5 px-2 sm:px-3 transition-all duration-300",
                  isMiniMode ? "h-7 sm:h-8" : "h-8 sm:h-9"
                )}
              >
                <Coins className={cn(
                  "text-primary transition-all duration-300",
                  isMiniMode ? "w-3.5 h-3.5" : "w-4 h-4"
                )} />
                <span className={cn(
                  "font-semibold text-primary transition-all duration-300",
                  isMiniMode ? "text-xs" : "text-sm"
                )}>{credits}</span>
              </Button>

              {/* Search - Mobile Only */}
              <div className="md:hidden">
                <GlobalSearch />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Page History - Hidden on mobile */}
              <div className="hidden md:block">
                <PageHistory />
              </div>

              {/* Messages - Mobile Visible */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className={cn(
                  "transition-all duration-300",
                  isMiniMode ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-9 sm:w-9",
                  location.pathname === "/messages" && "text-primary"
                )}
              >
                <MessageCircle className={cn(
                  "transition-all duration-300",
                  isMiniMode ? "w-4 h-4" : "w-5 h-5"
                )} />
              </Button>

              {/* Admin Panel - Desktop */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className={cn(
                    "transition-all duration-300 hidden lg:flex",
                    isMiniMode ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-9 sm:w-9"
                  )}
                  title="Admin Panel"
                >
                  <Shield className={cn(
                    "transition-all duration-300",
                    isMiniMode ? "w-4 h-4" : "w-5 h-5"
                  )} />
                </Button>
              )}

              {/* Profile Avatar with double-click for match */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className={cn(
                  "rounded-full p-0 hover:scale-105 transition-all duration-300",
                  isMiniMode ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-9 sm:w-9"
                )}
              >
                <Avatar 
                  className={cn(
                    "border-2 border-primary/20 transition-all duration-300",
                    isMiniMode ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-9 sm:h-9"
                  )}
                >
                  <AvatarImage src={profilePhoto} alt={username} />
                  <AvatarFallback className={cn(
                    "bg-gradient-primary text-primary-foreground transition-all duration-300",
                    isMiniMode ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
                  )}>
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} size="sm">
              Giriş Yap
            </Button>
          )}
        </div>
          </div>
        </div>
      </header>

      {/* Create Post Dialog */}
      <Suspense fallback={<div />}>
        <LazyCreatePostDialog
          open={createPostDialogOpen}
          onOpenChange={setCreatePostDialogOpen}
          userId={currentUserId || ""}
          username={username}
          profilePhoto={profilePhoto}
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