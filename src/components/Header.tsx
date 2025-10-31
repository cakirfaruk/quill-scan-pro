import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Coins, LogOut, User, Heart, CreditCard, ChevronDown, Sparkles, Calendar, Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [credits, setCredits] = useState(0);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          loadUserProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, username")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setCredits(profile.credits);
        setUsername(profile.username);
      }

      // Check if user is admin
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
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Çıkış yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    navigate("/auth");
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-gradient-primary rounded-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Kişisel Analiz Merkezi
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                AI destekli çoklu analiz platformu
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            {isLoggedIn && (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="default" size="sm" className="gap-2">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      Analizler
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                    <DropdownMenuLabel>Analiz Türleri</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" />
                        El Yazısı Analizi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/numeroloji" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4" />
                        Numeroloji Analizi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dogum-haritasi" className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="w-4 h-4" />
                        Doğum Haritası
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/compatibility" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" />
                        Uyum Analizi
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/history">
                  <Button variant="ghost" size="sm">
                    Analizlerim
                  </Button>
                </Link>

                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Profilim
                  </Button>
                </Link>

                <Link to="/friends">
                  <Button variant="ghost" size="sm">
                    Arkadaşlarım
                  </Button>
                </Link>
              </>
            )}
            <Link to="/about">
              <Button variant="ghost" size="sm">
                Hakkımızda
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="ghost" size="sm">
                SSS
              </Button>
            </Link>

            {isLoggedIn ? (
              <>
            <button 
              onClick={() => navigate("/credits")}
              className="flex items-center gap-2 px-3 xl:px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              <span className="font-semibold text-sm xl:text-base text-primary">{credits}</span>
            </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{username}</p>
                        <p className="text-xs text-muted-foreground">{credits} kredi</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/credits")} className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Kredi Satın Al
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} className="bg-gradient-primary hover:opacity-90" size="sm">
                Giriş Yap
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn && (
              <button 
                onClick={() => navigate("/credits")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-lg"
              >
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-primary">{credits}</span>
              </button>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Menü</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {isLoggedIn ? (
                    <>
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium">{username}</p>
                        <p className="text-xs text-muted-foreground">{credits} kredi</p>
                      </div>

                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="default" className="w-full justify-start gap-2">
                            Admin Panel
                          </Button>
                        </Link>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase px-2">Analiz Türleri</p>
                        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <FileText className="w-4 h-4" />
                            El Yazısı Analizi
                          </Button>
                        </Link>
                        <Link to="/numeroloji" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <Sparkles className="w-4 h-4" />
                            Numeroloji Analizi
                          </Button>
                        </Link>
                        <Link to="/dogum-haritasi" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <Calendar className="w-4 h-4" />
                            Doğum Haritası
                          </Button>
                        </Link>
                        <Link to="/compatibility" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <Heart className="w-4 h-4" />
                            Uyum Analizi
                          </Button>
                        </Link>
                      </div>

                      <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Analizlerim
                        </Button>
                      </Link>

                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <User className="w-4 h-4" />
                          Profilim
                        </Button>
                      </Link>

                      <Link to="/friends" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Users className="w-4 h-4" />
                          Arkadaşlarım
                        </Button>
                      </Link>

                      <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Hakkımızda
                        </Button>
                      </Link>

                      <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          SSS
                        </Button>
                      </Link>

                      <div className="border-t pt-4 space-y-2">
                        <Button 
                          onClick={() => {
                            navigate("/credits");
                            setMobileMenuOpen(false);
                          }} 
                          variant="outline" 
                          className="w-full justify-start gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Kredi Satın Al
                        </Button>
                        <Button 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }} 
                          variant="ghost" 
                          className="w-full justify-start gap-2 text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          Çıkış Yap
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Hakkımızda
                        </Button>
                      </Link>
                      <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          SSS
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => {
                          navigate("/auth");
                          setMobileMenuOpen(false);
                        }} 
                        className="bg-gradient-primary hover:opacity-90 w-full"
                      >
                        Giriş Yap / Üye Ol
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};