import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Coins, LogOut, User, Heart, CreditCard, ChevronDown, Sparkles, Calendar, Menu, MessageCircle, Settings, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { useImpersonate } from "@/hooks/use-impersonate";
import { useOnlineStatus } from "@/hooks/use-online-status";

export const Header = () => {
  const [credits, setCredits] = useState(0);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isImpersonating, stopImpersonation, getEffectiveUserId } = useImpersonate();

  // Use online status hook
  useOnlineStatus(currentUserId);

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

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)  // Always use real user ID for admin check
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
                {isImpersonating && (
                  <Button 
                    onClick={stopImpersonation}
                    variant="destructive" 
                    size="sm" 
                    className="gap-2 animate-pulse"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Moduna Dön
                  </Button>
                )}
                
                {isAdmin && !isImpersonating && (
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
                      <Link to="/handwriting" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4" />
                        El Yazısı Analizi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/numerology" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4" />
                        Numeroloji Analizi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/birth-chart" className="flex items-center gap-2 cursor-pointer">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  Fallar & Kehanetler
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card z-50">
                <DropdownMenuItem asChild>
                  <Link to="/tarot" className="cursor-pointer">
                    🔮 Tarot Falı
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/coffee-fortune" className="cursor-pointer">
                    ☕ Kahve Falı
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dream" className="cursor-pointer">
                    🌙 Rüya Tabiri
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/daily-horoscope" className="cursor-pointer">
                    🌟 Günlük Kehanet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/palmistry" className="cursor-pointer">
                    🤲 El Okuma
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/feed">
              <Button variant="ghost" size="sm">
                Akış
              </Button>
            </Link>

            <Link to="/match">
              <Button variant="ghost" size="sm">
                Eşleşme
              </Button>
            </Link>
              </>
            )}
            
            {!isLoggedIn && (
              <>
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
              </>
            )}

            {isLoggedIn ? (
              <>
            <NotificationBell />
            
            <button 
              onClick={() => navigate("/credits")}
              className="flex items-center gap-2 px-3 xl:px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              <span className="font-semibold text-sm xl:text-base text-primary">{credits}</span>
            </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative">
                      <Avatar className="w-9 h-9 border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer">
                        <AvatarImage src={profilePhoto} alt={username} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profilePhoto} alt={username} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{username}</p>
                          <p className="text-xs text-muted-foreground">{credits} kredi</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profilim
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/friends" className="cursor-pointer flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Arkadaşlarım
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mesajlar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Ayarlar
                      </Link>
                    </DropdownMenuItem>
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
                <ScrollArea className="h-[calc(100vh-80px)] mt-6">
                     <div className="flex flex-col gap-4 pr-4">
                      {isLoggedIn ? (
                        <>
                          <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm font-medium">{username}</p>
                            <p className="text-xs text-muted-foreground">{credits} kredi</p>
                          </div>

                          {isImpersonating && (
                            <Button 
                              onClick={() => {
                                setMobileMenuOpen(false);
                                stopImpersonation();
                              }}
                              variant="destructive" 
                              className="w-full justify-start gap-2 animate-pulse"
                            >
                              <Shield className="w-4 h-4" />
                              Admin Moduna Dön
                            </Button>
                          )}

                          {isAdmin && !isImpersonating && (
                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                              <Button variant="default" className="w-full justify-start gap-2">
                                Admin Panel
                              </Button>
                            </Link>
                          )}

                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="analyses" className="border-none">
                            <AccordionTrigger className="text-sm font-semibold px-0 py-2 hover:no-underline">
                              Analiz Türleri
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
                              <div className="space-y-1">
                                <Link to="/handwriting" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <FileText className="w-4 h-4" />
                                    El Yazısı
                                  </Button>
                                </Link>
                                <Link to="/numerology" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <Sparkles className="w-4 h-4" />
                                    Numeroloji
                                  </Button>
                                </Link>
                                <Link to="/birth-chart" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <Calendar className="w-4 h-4" />
                                    Doğum Haritası
                                  </Button>
                                </Link>
                                <Link to="/compatibility" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <Heart className="w-4 h-4" />
                                    Uyumluluk
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="fortune" className="border-none">
                            <AccordionTrigger className="text-sm font-semibold px-0 py-2 hover:no-underline">
                              Fallar & Kehanetler
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
                              <div className="space-y-1">
                                <Link to="/tarot" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    🔮 Tarot
                                  </Button>
                                </Link>
                                <Link to="/coffee-fortune" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    ☕ Kahve Falı
                                  </Button>
                                </Link>
                                <Link to="/dream" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    🌙 Rüya
                                  </Button>
                                </Link>
                                <Link to="/daily-horoscope" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    🌟 Kehanet
                                  </Button>
                                </Link>
                                <Link to="/palmistry" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    🤲 El Okuma
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="social" className="border-none">
                            <AccordionTrigger className="text-sm font-semibold px-0 py-2 hover:no-underline">
                              Sosyal
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
                              <div className="space-y-1">
                                <Link to="/match" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    💕 Eşleşme
                                  </Button>
                                </Link>
                                <Link to="/feed" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start h-9">
                                    📱 Akış
                                  </Button>
                                </Link>
                                <Link to="/friends" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <Heart className="w-4 h-4" />
                                    Arkadaşlar
                                  </Button>
                                </Link>
                                <Link to="/messages" onClick={() => setMobileMenuOpen(false)}>
                                  <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                                    <MessageCircle className="w-4 h-4" />
                                    Mesajlar
                                  </Button>
                                </Link>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start h-9">
                            📋 Analizlerim
                          </Button>
                        </Link>

                        <div className="border-t pt-3 space-y-1">
                          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                              <User className="w-4 h-4" />
                              Profil
                            </Button>
                          </Link>
                          <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
                              <Settings className="w-4 h-4" />
                              Ayarlar
                            </Button>
                          </Link>
                          <Button 
                            onClick={() => {
                              navigate("/credits");
                              setMobileMenuOpen(false);
                            }} 
                            variant="outline" 
                            className="w-full justify-start gap-2 h-9"
                          >
                            <CreditCard className="w-4 h-4" />
                            Kredi Al
                          </Button>
                          <Button 
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }} 
                            variant="ghost" 
                            className="w-full justify-start gap-2 text-destructive h-9"
                          >
                            <LogOut className="w-4 h-4" />
                            Çıkış
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
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};