import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Brain, Target, Sparkles, Heart, Users, MessageCircle, Moon, Coffee, Hand, Star, Calendar, FileText, Zap, Shield, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParallax } from "@/hooks/use-parallax";

export const LandingPage = () => {
  const navigate = useNavigate();

  const heroRef = useRef<HTMLElement>(null);
  const bgLeftRef = useRef<HTMLDivElement>(null);
  const bgRightRef = useRef<HTMLDivElement>(null);

  const heroOffset = useParallax(heroRef, { speed: 0.3, direction: "up" });
  const bgLeftOffset = useParallax(bgLeftRef, { speed: 0.5, direction: "down" });
  const bgRightOffset = useParallax(bgRightRef, { speed: 0.4, direction: "up" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
      <Header />

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="text-center py-16 md:py-24 animate-fade-in relative"
          style={{ transform: `translateY(${heroOffset}px)` }}
        >
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div
              ref={bgLeftRef}
              className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse transition-transform duration-300"
              style={{ transform: `translateY(${bgLeftOffset}px)` }}
            ></div>
            <div
              ref={bgRightRef}
              className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse transition-transform duration-300"
              style={{ animationDelay: "1s", transform: `translateY(${bgRightOffset}px)` }}
            ></div>
          </div>

          <Badge className="mb-6 text-sm px-4 py-2" variant="secondary">
            <Sparkles className="w-4 h-4 mr-2" />
            {"Yapay Zeka Destekli Analiz Platformu"}
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-primary animate-gradient">
            {"Kendini Ke\u015Ffet,"}<br />{"Ruhunu Tan\u0131, E\u015Fini Bul"}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            {"Tarot, kahve fal\u0131, r\u00FCya tabiri, el okuma ve astroloji ile derinlemesine ki\u015Filik analizleri. Numeroloji ve do\u011Fum haritas\u0131 uyumlar\u0131yla ideal e\u015Fini bul."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/auth")} variant="gradient" className="group text-lg px-8 py-6">
              {"\u00DCcretsiz Ba\u015Fla"}
              <Zap className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="text-lg px-8 py-6">
              {"Nas\u0131l \u00C7al\u0131\u015F\u0131r?"}
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>{"100% G\u00FCvenli"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{"Binlerce Kullan\u0131c\u0131"}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>{"Y\u00FCksek Do\u011Fruluk"}</span>
            </div>
          </div>
        </section>

        {/* Analysis Types Section */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <Brain className="w-4 h-4 mr-2" />
              {"Analiz & Kehanet T\u00FCrleri"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {"9 Farkl\u0131 Analiz Y\u00F6ntemi"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <CardTitle>Tarot Okuma</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Coffee className="w-7 h-7 text-amber-600" />
                </div>
                <CardTitle>{"Kahve Fal\u0131"}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Moon className="w-7 h-7 text-indigo-600" />
                </div>
                <CardTitle>{"R\u00FCya Tabiri"}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Hand className="w-7 h-7 text-pink-600" />
                </div>
                <CardTitle>El Okuma</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-7 h-7 text-yellow-600" />
                </div>
                <CardTitle>{"G\u00FCnl\u00FCk Kehanet"}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-emerald-600" />
                </div>
                <CardTitle>Numeroloji</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-violet-600" />
                </div>
                <CardTitle>{"Do\u011Fum Haritas\u0131"}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle>{"El Yaz\u0131s\u0131 Analizi"}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-red-600" />
                </div>
                <CardTitle>Uyum Analizi</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Social Features Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              {"Sosyal \u00D6zellikler"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {"Sadece Analiz De\u011Fil, Bir Topluluk"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {"Analizlerinizi payla\u015F\u0131n, yeni insanlarla tan\u0131\u015F\u0131n ve uyumlu e\u015Fle\u015Fmeler bulun"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">{"Ak\u0131ll\u0131 E\u015Fle\u015Fme"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {"Numeroloji ve astroloji uyumlar\u0131na g\u00F6re size en uygun ki\u015Fileri bulun"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">{"Anl\u0131k Mesajla\u015Fma"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {"E\u015Fle\u015Fti\u011Finiz ki\u015Filerle an\u0131nda ileti\u015Fime ge\u00E7in, sohbet edin"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-center">{"Arkada\u015Fl\u0131k A\u011F\u0131"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {"Arkada\u015Flar\u0131n\u0131z\u0131n analizlerini g\u00F6r\u00FCn, deneyimlerinizi payla\u015F\u0131n"}
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
              {"H\u0131zl\u0131 ve Kolay"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {"4 Ad\u0131mda Ba\u015Flay\u0131n"}
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Kay\u0131t Ol",
                description: "E-posta ile \u00FCcretsiz hesap olu\u015Ftur, kredi kazan",
                icon: Users
              },
              {
                step: "2",
                title: "Analiz Se\u00E7",
                description: "9 farkl\u0131 analiz t\u00FCr\u00FCnden istedi\u011Fini se\u00E7",
                icon: Brain
              },
              {
                step: "3",
                title: "Sonu\u00E7lar\u0131 \u0130ncele",
                description: "Detayl\u0131 AI destekli analizleri ke\u015Ffet",
                icon: Sparkles
              },
              {
                step: "4",
                title: "E\u015Fle\u015F & Payla\u015F",
                description: "Uyumlu ki\u015Filerle tan\u0131\u015F, arkada\u015F ol",
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
                {"Hemen Ke\u015Ffetmeye Ba\u015Fla"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {"Binlerce ki\u015Fi zaten kendini ke\u015Ffetti ve ideal e\u015Fini buldu. \u015Eimdi senin s\u0131ran!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} variant="gradient" className="text-lg px-8 py-6">
                  {"\u00DCcretsiz Hesap Olu\u015Ftur"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/faq")} className="text-lg px-8 py-6">
                  {"S\u0131k\u00E7a Sorulan Sorular"}
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
              <h3 className="font-bold text-lg mb-4">{"Hakk\u0131m\u0131zda"}</h3>
              <p className="text-sm text-muted-foreground">
                {"Yapay zeka destekli analiz ve e\u015Fle\u015Fme platformu"}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Analizler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tarot Okuma</li>
                <li>{"Kahve Fal\u0131"}</li>
                <li>Numeroloji</li>
                <li>{"Do\u011Fum Haritas\u0131"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{"\u00D6zellikler"}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{"Ak\u0131ll\u0131 E\u015Fle\u015Fme"}</li>
                <li>{"Mesajla\u015Fma"}</li>
                <li>{"Arkada\u015Fl\u0131k"}</li>
                <li>{"Profil Payla\u015F\u0131m\u0131"}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Destek</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/faq")}>SSS</button></li>
                <li><button onClick={() => navigate("/about")}>{"Hakk\u0131m\u0131zda"}</button></li>
                <li>{"\u0130leti\u015Fim"}</li>
                <li>Gizlilik</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t text-sm text-muted-foreground">
            <p>&copy; 2024 Quill Scan Pro. {"T\u00FCm haklar\u0131 sakl\u0131d\u0131r."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
