import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Feed from "./Feed";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Brain, Target, Sparkles, Heart, Users, MessageCircle, Moon, Coffee, Hand, Star, Calendar, FileText, Zap, Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      <Header />
      
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24 animate-fade-in relative">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>
          
          <Badge className="mb-6 text-sm px-4 py-2" variant="secondary">
            <Sparkles className="w-4 h-4 mr-2" />
            Yapay Zeka Destekli Analiz Platformu
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-primary animate-gradient">
            Kendini Keşfet,<br />Ruhunu Tanı, Eşini Bul
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Tarot, kahve falı, rüya tabiri, el okuma ve astroloji ile derinlemesine kişilik analizleri. 
            Numeroloji ve doğum haritası uyumlarıyla ideal eşini bul.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="group text-lg px-8 py-6">
              Ücretsiz Başla
              <Zap className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="text-lg px-8 py-6">
              Nasıl Çalışır?
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>100% Güvenli</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Binlerce Kullanıcı</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Yüksek Doğruluk</span>
            </div>
          </div>
        </section>

        {/* Analysis Types Section */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <Brain className="w-4 h-4 mr-2" />
              Analiz & Kehanet Türleri
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              9 Farklı Analiz Yöntemi
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Yapay zeka destekli gelişmiş algoritmalarla kişiliğini keşfet, geleceğini öğren
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Tarot Okuma</CardTitle>
                <CardDescription>
                  Geçmiş, şimdi ve gelecek hakkında derinlemesine yorumlar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Coffee className="w-7 h-7 text-amber-600" />
                </div>
                <CardTitle>Kahve Falı</CardTitle>
                <CardDescription>
                  Geleneksel yöntemle fincan yorumlama ve analiz
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Moon className="w-7 h-7 text-indigo-600" />
                </div>
                <CardTitle>Rüya Tabiri</CardTitle>
                <CardDescription>
                  Rüyalarınızın sembolik anlamlarını keşfedin
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Hand className="w-7 h-7 text-pink-600" />
                </div>
                <CardTitle>El Okuma</CardTitle>
                <CardDescription>
                  Avuç içi çizgilerinizle karakter analizi
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-7 h-7 text-yellow-600" />
                </div>
                <CardTitle>Günlük Kehanet</CardTitle>
                <CardDescription>
                  Her gün size özel hazırlanan kehanetler
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-emerald-600" />
                </div>
                <CardTitle>Numeroloji</CardTitle>
                <CardDescription>
                  Sayıların gücüyle yaşam yolu ve kader analizi
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-violet-600" />
                </div>
                <CardTitle>Doğum Haritası</CardTitle>
                <CardDescription>
                  Astrolojik konum analizleri ve burç yorumları
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle>El Yazısı Analizi</CardTitle>
                <CardDescription>
                  Grafologi ile kişilik özelliklerinizi keşfedin
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-red-600" />
                </div>
                <CardTitle>Uyum Analizi</CardTitle>
                <CardDescription>
                  İki kişi arasındaki uyum oranlarını detaylı inceleyin
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Social Features Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Sosyal Özellikler
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Sadece Analiz Değil, Bir Topluluk
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Analizlerinizi paylaşın, yeni insanlarla tanışın ve uyumlu eşleşmeler bulun
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">Akıllı Eşleşme</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Numeroloji ve astroloji uyumlarına göre size en uygun kişileri bulun
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">Anlık Mesajlaşma</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Eşleştiğiniz kişilerle anında iletişime geçin, sohbet edin
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">Arkadaşlık Ağı</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Arkadaşlarınızın analizlerini görün, deneyimlerinizi paylaşın
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Hızlı ve Kolay
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              4 Adımda Başlayın
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Kayıt Ol",
                description: "E-posta ile ücretsiz hesap oluştur, kredi kazan",
                icon: Users
              },
              {
                step: "2",
                title: "Analiz Seç",
                description: "9 farklı analiz türünden istediğini seç",
                icon: Brain
              },
              {
                step: "3",
                title: "Sonuçları İncele",
                description: "Detaylı AI destekli analizleri keşfet",
                icon: Sparkles
              },
              {
                step: "4",
                title: "Eşleş & Paylaş",
                description: "Uyumlu kişilerle tanış, arkadaş ol",
                icon: Heart
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{item.step}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-xl">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent">
            <CardContent className="text-center py-12 md:py-16">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hemen Keşfetmeye Başla
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Binlerce kişi zaten kendini keşfetti ve ideal eşini buldu. Şimdi senin sıran!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
                  Ücretsiz Hesap Oluştur
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/faq")} className="text-lg px-8 py-6">
                  Sıkça Sorulan Sorular
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Hakkımızda</h3>
              <p className="text-sm text-muted-foreground">
                Yapay zeka destekli analiz ve eşleşme platformu
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Analizler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tarot Okuma</li>
                <li>Kahve Falı</li>
                <li>Numeroloji</li>
                <li>Doğum Haritası</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Özellikler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Akıllı Eşleşme</li>
                <li>Mesajlaşma</li>
                <li>Arkadaşlık</li>
                <li>Profil Paylaşımı</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Destek</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/faq")}>SSS</button></li>
                <li><button onClick={() => navigate("/about")}>Hakkımızda</button></li>
                <li>İletişim</li>
                <li>Gizlilik</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t text-sm text-muted-foreground">
            <p>&copy; 2024 Quill Scan Pro. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
