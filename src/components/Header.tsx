import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Coins, LogOut, User, Heart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const [credits, setCredits] = useState(0);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                El Yazısı Analizi
              </h1>
              <p className="text-xs text-muted-foreground">
                AI destekli profesyonel analiz
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="default" size="sm" className="gap-2 bg-gradient-primary hover:opacity-90">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/history">
                  <Button variant="ghost" size="sm">
                    Geçmiş
                  </Button>
                </Link>
                <Link to="/compatibility">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Heart className="w-4 h-4" />
                    Uyum
                  </Button>
                </Link>
                <Link to="/numeroloji">
                  <Button variant="ghost" size="sm">
                    Numeroloji
                  </Button>
                </Link>
                <Link to="/dogum-haritasi">
                  <Button variant="ghost" size="sm">
                    Doğum Haritası
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
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{credits}</span>
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
              <Button onClick={() => navigate("/auth")} className="bg-gradient-primary hover:opacity-90">
                Giriş Yap / Üye Ol
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};