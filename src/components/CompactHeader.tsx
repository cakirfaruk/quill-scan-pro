import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Search, Plus, Video, Sparkles, Shield, Coins, MessageCircle, Menu
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImpersonate } from "@/hooks/use-impersonate";
import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { CreatePostDialog } from "@/components/CreatePostDialog";

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
  const { isImpersonating, stopImpersonation, getEffectiveUserId } = useImpersonate();

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
      const effectiveUserId = getEffectiveUserId(user.id);
      if (!effectiveUserId) {
        setIsLoggedIn(false);
        return;
      }

      setCurrentUserId(effectiveUserId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, username, profile_photo")
        .eq("user_id", effectiveUserId)
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
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-gradient-primary rounded-lg shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
            KAM
          </span>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        {isLoggedIn && (
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/" ? "text-primary" : ""}`}
              >
                <Home className="w-4 h-4" />
                Ana Sayfa
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/explore" ? "text-primary" : ""}`}
              >
                <Search className="w-4 h-4" />
                Keşfet
              </Button>
            </Link>
            <Link to="/feed">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setCreatePostDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Oluştur
              </Button>
            </Link>
            <Link to="/reels">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/reels" ? "text-primary" : ""}`}
              >
                <Video className="w-4 h-4" />
                Reels
              </Button>
            </Link>
            <Link to="/discovery">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${location.pathname === "/discovery" ? "text-primary" : ""}`}
              >
                <Sparkles className="w-4 h-4" />
                Analizler
              </Button>
            </Link>
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
                className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
              >
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary text-sm">{credits}</span>
              </Button>

              {/* Messages - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className="h-8 sm:h-9 w-8 sm:w-9 hidden lg:flex"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* Impersonation Warning */}
              {isImpersonating && (
                <Button
                  onClick={stopImpersonation}
                  variant="destructive"
                  size="sm"
                  className="gap-2 animate-pulse hidden lg:flex"
                >
                  <Shield className="w-4 h-4" />
                  Admin Modu
                </Button>
              )}

              {/* Main Menu - Desktop only for admin */}
              {isAdmin && !isImpersonating && (
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
                onClick={() => navigate("/profile")}
                onDoubleClick={() => navigate("/match")}
                className="h-8 sm:h-9 w-8 sm:w-9 rounded-full p-0 hover:scale-105 transition-transform"
                title="Çift tıkla: Eşleşme ekranı"
              >
                <Avatar className="w-8 sm:w-9 h-8 sm:h-9 border-2 border-primary/20">
                  <AvatarImage src={profilePhoto} alt={username} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
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

      {/* Create Post Dialog */}
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
    </header>
  );
};