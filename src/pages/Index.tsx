import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MissionProgressBar } from "@/components/MissionProgressBar";
import { DashboardStats } from "@/components/DashboardStats";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { LiveDemoSection } from "@/components/landing/LiveDemoSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { GamificationPreview } from "@/components/landing/GamificationPreview";
import { CTASection } from "@/components/landing/CTASection";
import { FooterSection } from "@/components/landing/FooterSection";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id || "");
      
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", session.user.id)
          .single();
        setUsername(profile?.username || "");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id || "");
      
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", session.user.id)
          .single();
        setUsername(profile?.username || "");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show personalized dashboard for logged-in users
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Header />
        <MissionProgressBar />
        
        <main className="pt-20 pb-24">
          <div className="container px-4 py-6 max-w-7xl mx-auto space-y-8">
            {/* Personalized Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {username ? `Hoş Geldin, ${username}!` : 'Hoş Geldin!'} 🌟
              </h1>
              <p className="text-muted-foreground">
                Bugün kendini keşfetmeye hazır mısın?
              </p>
            </motion.div>

            {/* Compact Statistics */}
            <DashboardStats userId={userId} />

            {/* Quick Actions */}
            <QuickActions userId={userId} />

            {/* Recent Activity */}
            <RecentActivity userId={userId} />
          </div>
        </main>
      </div>
    );
  }

  // Show landing page for logged-out users
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ProblemSection />
      <LiveDemoSection />
      <SocialProofSection />
      <FeaturesSection />
      <TestimonialsSection />
      <GamificationPreview />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Index;
