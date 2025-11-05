import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Scroll, Coffee, Heart, Moon, Star, PenLine } from "lucide-react";
import { Button } from "./ui/button";
import { CreatePostDialog } from "./CreatePostDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface QuickAction {
  icon: typeof Sparkles;
  label: string;
  action: () => void;
  color: string;
}

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, profile_photo")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          setCurrentUser({
            id: user.id,
            username: profile.username,
            profilePhoto: profile.profile_photo,
          });
        }
      }
    };
    loadUser();
  }, []);

  const quickActions: QuickAction[] = [
    {
      icon: PenLine,
      label: "Yeni Gönderi",
      action: () => {
        setShowPostDialog(true);
        setIsOpen(false);
      },
      color: "from-primary to-accent",
    },
    {
      icon: Scroll,
      label: "Tarot Falı",
      action: () => {
        navigate("/tarot");
        setIsOpen(false);
      },
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Coffee,
      label: "Kahve Falı",
      action: () => {
        navigate("/coffee-fortune");
        setIsOpen(false);
      },
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Heart,
      label: "Eşleşme",
      action: () => {
        navigate("/match");
        setIsOpen(false);
      },
      color: "from-red-500 to-pink-500",
    },
    {
      icon: Moon,
      label: "Rüya Yorumu",
      action: () => {
        navigate("/dream-interpretation");
        setIsOpen(false);
      },
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: Star,
      label: "Günlük Burç",
      action: () => {
        navigate("/daily-horoscope");
        setIsOpen(false);
      },
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 pb-safe-bottom pr-safe-right">
        {/* Quick Action Menu Items */}
        <div
          className={cn(
            "flex flex-col gap-3 mb-3 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.label}
                className="flex items-center gap-3 animate-in slide-in-from-bottom"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <span className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg border border-border/50 whitespace-nowrap">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  onClick={action.action}
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg bg-gradient-to-br hover:scale-110 transition-transform duration-200",
                    action.color
                  )}
                >
                  <Icon className="h-5 w-5 text-white" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Main FAB Button */}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-accent hover:scale-110 transition-all duration-300",
            isOpen && "rotate-45"
          )}
          style={{
            boxShadow: "0 4px 20px rgba(var(--primary-rgb, 147, 51, 234), 0.4)",
          }}
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </Button>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {currentUser && (
        <CreatePostDialog
          open={showPostDialog}
          onOpenChange={setShowPostDialog}
          userId={currentUser.id}
          username={currentUser.username}
          profilePhoto={currentUser.profilePhoto}
        />
      )}
    </>
  );
};
