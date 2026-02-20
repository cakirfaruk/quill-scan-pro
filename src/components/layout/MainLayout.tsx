import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { User, Sparkles, Heart, Plus, Network } from "lucide-react";
import { useState, lazy, Suspense } from "react";
const CreatePostDialog = lazy(() => import("@/components/CreatePostDialog").then(m => ({ default: m.CreatePostDialog })));
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
    const { user, profile } = useAuth();
    const userId = user?.id ?? null;
    const currentProfile = { username: profile?.username ?? "", profile_photo: profile?.profile_photo ?? null };
    const { toast } = useToast();

    const handleCreatePost = () => {
        if (!userId) {
            toast({
                title: "Giriş Gerekli",
                description: "Paylaşım yapmak için lütfen giriş yapın.",
                variant: "destructive",
            });
            navigate("/auth");
            return;
        }
        setCreatePostDialogOpen(true);
    };

    const isActive = (path: string) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { id: "connect", icon: Network, label: "Connect", path: "/" },
        { id: "align", icon: Heart, label: "Align", path: "/match" },
        { id: "action", icon: Plus, label: "Create", action: handleCreatePost, highlight: true },
        { id: "insight", icon: Sparkles, label: "Insight", path: "/discovery" },
        { id: "profile", icon: User, label: "Profile", path: `/profile${currentProfile.username ? `/${currentProfile.username}` : ''}` },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-28 relative overflow-hidden">

            {/* Ambient Background - Static gradient (no blur, no animation) */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/3" />
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/3 via-transparent to-transparent" />
            </div>

            {/* Main Content Area */}
            <main className="min-h-screen relative z-10 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>

            {/* Floating Dynamic Dock V2 */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none">
                <nav className="bg-black/80 rounded-[2.5rem] p-2 flex items-center gap-1 sm:gap-2 border border-white/10 shadow-2xl pointer-events-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        if (item.highlight) {
                            return (
                                <div key={item.id} className="relative mx-1 sm:mx-3">
                                    <button
                                        onClick={item.action}
                                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-neon-gradient shadow-neon flex items-center justify-center border border-white/30 text-white z-10 hover:scale-110 active:scale-95 transition-transform duration-200"
                                    >
                                        <Icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
                                    </button>
                                </div>
                            );
                        }

                        const active = item.path ? isActive(item.path) : false;

                        return (
                            <Link key={item.id} to={item.path!}>
                                <div
                                    className={cn(
                                        "relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-[1.5rem] transition-all duration-200 group hover:scale-105 hover:bg-white/5 active:scale-95",
                                        active ? "text-primary" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6 z-10 transition-all duration-300", active && "drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] scale-110")} />

                                    {/* Tooltip */}
                                    <span className="absolute -top-10 bg-black/80 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-glass">
                                        {item.label}
                                    </span>

                                    {active && (
                                        <div
                                            className="absolute inset-0 bg-primary/10 rounded-[1.5rem] border border-primary/20 z-0 transition-all duration-300"
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <Suspense fallback={null}>
              <CreatePostDialog
                open={createPostDialogOpen}
                onOpenChange={setCreatePostDialogOpen}
                userId={userId || ""}
                username={currentProfile.username}
                profilePhoto={currentProfile.profile_photo}
                onPostCreated={() => {
                    toast({
                        title: "Başarılı",
                        description: "Evrensel mesajınız iletildi ✨",
                    });
                    setCreatePostDialogOpen(false);
                }}
              />
            </Suspense>
        </div>
    );
};
