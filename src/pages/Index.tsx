import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DailyMissionsWidget } from "@/components/DailyMissionsWidget";
import { MissionProgressBar } from "@/components/MissionProgressBar";
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
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
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

  // Show dashboard for logged-in users
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <Header />
        <MissionProgressBar />
        
        <main className="pt-16">
          <div className="container px-4 py-4">
            <DailyMissionsWidget />
          </div>
          
          {/* Dashboard Content */}
          <section className="py-12">
            <div className="container px-4">
              <h2 className="text-3xl font-bold mb-8">Analizlerimiz</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/tarot")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">🔮</div>
                    <h3 className="text-xl font-semibold mb-2">Tarot Falı</h3>
                    <p className="text-muted-foreground">
                      22 büyük arkana kartı ile geleceğini keşfet
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/coffee-fortune")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">☕</div>
                    <h3 className="text-xl font-semibold mb-2">Kahve Falı</h3>
                    <p className="text-muted-foreground">
                      Fincanındaki işaretler ne anlatıyor?
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/dream-interpretation")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">💭</div>
                    <h3 className="text-xl font-semibold mb-2">Rüya Tabiri</h3>
                    <p className="text-muted-foreground">
                      Rüyalarının gizli anlamlarını öğren
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/birth-chart")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">⭐</div>
                    <h3 className="text-xl font-semibold mb-2">Doğum Haritası</h3>
                    <p className="text-muted-foreground">
                      Yıldızların sana ne söylediğini keşfet
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/numerology")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">🔢</div>
                    <h3 className="text-xl font-semibold mb-2">Numeroloji</h3>
                    <p className="text-muted-foreground">
                      Sayıların gücünü keşfet, kader numaranı öğren
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/palmistry")}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">🤲</div>
                    <h3 className="text-xl font-semibold mb-2">El Falı</h3>
                    <p className="text-muted-foreground">
                      Avuçlarındaki çizgiler hayatını anlatıyor
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Social Features */}
          <section className="py-12 bg-muted/30">
            <div className="container px-4">
              <h2 className="text-3xl font-bold mb-8 text-center">Sosyal Özellikler</h2>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/match")}>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl mb-4">💕</div>
                    <h3 className="text-xl font-semibold mb-2">Akıllı Eşleşme</h3>
                    <p className="text-muted-foreground">
                      Uyum puanına göre ideal eşini bul
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/messages")}>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2">Anında Mesajlaşma</h3>
                    <p className="text-muted-foreground">
                      Yeni insanlarla bağlantı kur
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-scale cursor-pointer" onClick={() => navigate("/friends")}>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold mb-2">Arkadaşlık Ağı</h3>
                    <p className="text-muted-foreground">
                      Benzer ruhlarla tanış
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
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
