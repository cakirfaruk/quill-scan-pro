import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Feed from "./Feed";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  // Show feed if logged in
  if (isLoggedIn) {
    return <Feed />;
  }

  // Show loading while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for non-logged in users
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <section className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Kendini Keşfet, Eşini Bul
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            El yazısı, numeroloji ve doğum haritası analizleri ile kendinizi keşfedin. Uyumlu eşleşmelerle yeni insanlarla tanışın.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="mr-4">
            Hemen Başla
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/about")}>
            Daha Fazla Bilgi
          </Button>
        </section>

        {/* Feature Cards */}
        <section className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <Brain className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Yapay Zeka Analizi</CardTitle>
              <CardDescription>
                Gelişmiş AI teknolojisi ile kişilik analizleri
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <Target className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Akıllı Eşleştirme</CardTitle>
              <CardDescription>
                Uyum oranlarına göre özel eşleşmeler
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Sosyal Keşif</CardTitle>
              <CardDescription>
                Arkadaşlarınızın analizlerini keşfedin
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Info Section */}
        <section className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-4 gap-8 mt-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Kayıt Ol</h3>
              <p className="text-sm text-muted-foreground">
                Ücretsiz hesap oluştur
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">Analiz Yaptır</h3>
              <p className="text-sm text-muted-foreground">
                Kişilik analizlerini tamamla
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">Eşleş</h3>
              <p className="text-sm text-muted-foreground">
                Uyumlu kişileri keşfet
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">4</span>
              </div>
              <h3 className="font-semibold">Bağlan</h3>
              <p className="text-sm text-muted-foreground">
                Mesajlaş ve arkadaş ol
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Quill Scan Pro. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
