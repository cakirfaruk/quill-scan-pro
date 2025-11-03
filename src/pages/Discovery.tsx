import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, Moon, Star, Coffee, Hand, TrendingUp, Brain, Calendar } from "lucide-react";

const Discovery = () => {
  const navigate = useNavigate();

  const analyses = [
    {
      title: "El Yazısı Analizi",
      description: "Kişilik özelliklerinizi el yazınızdan keşfedin",
      icon: "✍️",
      color: "from-blue-500 to-cyan-500",
      path: "/handwriting"
    },
    {
      title: "Numeroloji",
      description: "İsim ve doğum tarihinizle sayıların gücünü keşfedin",
      icon: "🔢",
      color: "from-purple-500 to-pink-500",
      path: "/numerology"
    },
    {
      title: "Doğum Haritası",
      description: "Yıldızların size söylediklerini öğrenin",
      icon: "🌟",
      color: "from-amber-500 to-orange-500",
      path: "/birth-chart"
    },
    {
      title: "Uyumluluk Analizi",
      description: "İki kişi arasındaki uyumu analiz edin",
      icon: "💕",
      color: "from-rose-500 to-red-500",
      path: "/compatibility"
    },
  ];

  const fortunes = [
    {
      title: "Tarot Falı",
      description: "Kartlarla geleceğinize dair ipuçları",
      icon: "🔮",
      color: "from-violet-500 to-purple-500",
      path: "/tarot"
    },
    {
      title: "Kahve Falı",
      description: "Fincanınızdaki semboller ne söylüyor?",
      icon: "☕",
      color: "from-amber-600 to-yellow-600",
      path: "/coffee-fortune"
    },
    {
      title: "Rüya Tabiri",
      description: "Rüyalarınızın gizli anlamlarını keşfedin",
      icon: "🌙",
      color: "from-indigo-500 to-blue-500",
      path: "/dream"
    },
    {
      title: "Günlük Kehanet",
      description: "Bugün sizi neler bekliyor?",
      icon: "⭐",
      color: "from-yellow-500 to-amber-500",
      path: "/daily-horoscope"
    },
    {
      title: "El Okuma",
      description: "Avuç içinizde gizli sırlar",
      icon: "🤲",
      color: "from-teal-500 to-emerald-500",
      path: "/palmistry"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-primary rounded-full mb-4 shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Keşfet
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Analizler ve fallarla kendinizi keşfedin, geleceğinize dair ipuçları edinin
          </p>
        </div>

        {/* Analyses Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Analizler</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyses.map((item) => (
              <Card 
                key={item.path}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Fortunes Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Fallar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fortunes.map((item) => (
              <Card 
                key={item.path}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <Card className="mt-10 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">İlk Analiziniz Ücretsiz!</h3>
            <p className="text-muted-foreground mb-4">
              Hesabınıza başlangıç kredisi tanımlandı. Hemen keşfetmeye başlayın.
            </p>
            <Button 
              onClick={() => navigate("/credits")}
              variant="outline"
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Kredi Durumunu Görüntüle
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Discovery;
