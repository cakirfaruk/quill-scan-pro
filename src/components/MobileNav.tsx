import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, Video, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { supabase } from "@/integrations/supabase/client";
import { useImpersonate } from "@/hooks/use-impersonate";
import { useToast } from "@/hooks/use-toast";

export const MobileNav = () => {
  const location = useLocation();
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentProfile, setCurrentProfile] = useState<{ username: string; profile_photo: string | null }>({ username: "", profile_photo: null });
  const { getEffectiveUserId } = useImpersonate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const effectiveUserId = getEffectiveUserId(user.id);
    if (!effectiveUserId) return;
    
    setUserId(effectiveUserId);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, profile_photo")
      .eq("user_id", effectiveUserId)
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
    { icon: Search, label: "Keşfet", path: "/explore" },
    { icon: Heart, label: "Eşleşme", path: "/match" },
    { icon: Plus, label: "Oluştur", action: handleCreatePost },
    { icon: Video, label: "Reels", path: "/reels" },
    { icon: Sparkles, label: "Analizler", path: "/discovery" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-lg z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
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