import { useState, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles, Shield, Coins, MessageCircle, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const NotificationBell = lazy(() => import("@/components/NotificationBell").then(m => ({ default: m.NotificationBell })));
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
const CreatePostDialog = lazy(() => import("@/components/CreatePostDialog").then(m => ({ default: m.CreatePostDialog })));
const GlobalSearch = lazy(() => import("@/components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

export const CompactHeader = () => {
  const { user, profile, isAdmin } = useAuth();
  const isLoggedIn = !!user;
  const currentUserId = user?.id;
  const username = profile?.username ?? "";
  const profilePhoto = profile?.profile_photo ?? "";
  const credits = profile?.credits ?? 0;
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { scrollDirection, scrollY } = useScrollDirection({ threshold: 10 });

  // Mini mode when scrolled past 100px
  const isMiniMode = scrollY > 100;
  // Hide when scrolling down past 200px
  const shouldHide = scrollDirection === "down" && scrollY > 200;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Çıkış yapıldı", description: "Başarıyla çıkış yaptınız." });
    navigate("/auth");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          shouldHide && "-translate-y-full"
        )}
        style={{
          backgroundColor: 'hsl(var(--card) / 0.97)',
          boxShadow: scrollY > 10
            ? '0 4px 20px hsl(var(--primary) / 0.15)'
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
            <Link
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
            </Link>

            {/* Global Search - Centered */}
            {isLoggedIn && (
              <div className="flex-1 max-w-md mx-4 hidden md:block">
                <Suspense fallback={null}>
                  <GlobalSearch />
                </Suspense>
              </div>
            )}

            {/* Desktop Navigation - Refactored to Sidebar */}
            <div className="hidden lg:block flex-1" />

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isLoggedIn ? (
                <>
                  {/* Credits */}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Kredi bakiyesi"
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
                    <Suspense fallback={null}>
                      <GlobalSearch />
                    </Suspense>
                  </div>

                  {/* Notifications */}
                  <Suspense fallback={null}>
                    <NotificationBell />
                  </Suspense>

                  {/* Messages - Mobile Visible */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mesajlar"
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

                  {/* Main Menu - Desktop only for admin */}
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 sm:h-9 w-8 sm:w-9 hidden lg:flex">
                          <Menu className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Profile Avatar with double-click for match */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Profilim"
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
      <Suspense fallback={null}>
        <CreatePostDialog
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