import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, Target, Shield, Zap, Users, Award, Sparkles,
  Hand, Hash, Moon, Heart, Coffee, Sun, BookOpen, Star
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const analysisTypes = [
    {
      icon: <Hand className="w-6 h-6" />,
      title: "El Yazısı Analizi",
      description: "Grafologi bilimi ile kişilik özelliklerinizi keşfedin",
      path: "/handwriting",
    },
    {
      icon: <Hash className="w-6 h-6" />,
      title: "Numeroloji",
      description: "Sayıların gücüyle hayatınızdaki potansiyelleri açığa çıkarın",
      path: "/numerology",
    },
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Doğum Haritası",
      description: "Astrolojik haritanız ile kaderinizi öğrenin",
      path: "/birth-chart",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Uyum Analizi",
      description: "İki kişinin ilişki uyumunu analiz edin",
      path: "/compatibility",
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Kahve Falı",
      description: "Türk kahvesi fincanınızdan geleceğe bakın",
      path: "/coffee-fortune",
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Tarot",
      description: "Tarot kartları ile içsel yolculuğunuza çıkın",
      path: "/tarot",
    },
    {
      icon: <Sun className="w-6 h-6" />,
      title: "Günlük Burç",
      description: "Her gün burcunuza özel yorumlar alın",
      path: "/daily-horoscope",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Rüya Yorumu",
      description: "Rüyalarınızın anlamlarını keşfedin",
      path: "/dream-interpretation",
    },
    {
      icon: <Hand className="w-6 h-6" />,
      title: "El Falı",
      description: "Avuç içi çizgilerinizden kaderinizi okuyun",
      path: "/palmistry",
    },
  ];

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "AI Destekli Analiz",
      description: "Gelişmiş yapay zeka algoritmaları ile hassas ve detaylı analizler",
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "9 Farklı Analiz",
      description: "El yazısı, numeroloji, tarot ve daha fazlası tek uygulamada",
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Güvenli ve Gizli",
      description: "Verileriniz şifrelenir ve kimseyle paylaşılmaz",
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Hızlı Sonuçlar",
      description: "Dakikalar içinde detaylı analiz sonuçlarına ulaşın",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Sosyal Platform",
      description: "Arkadaşlarınızla bağlantı kurun, paylaşın, eşleşin",
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Gamifikasyon",
      description: "Görevler, rozetler ve liderlik tablosu ile eğlenceli deneyim",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Stellara
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-2">
            Astroloji, kehanet ve sosyal bağlantının buluştuğu platform
          </p>
          <p className="text-sm text-muted-foreground">
            Versiyon 1.0.0
          </p>
        </div>

        {/* Analysis Types Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            9 Farklı Analiz Türü
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisTypes.map((analysis, idx) => (
              <Link key={idx} to={analysis.path}>
                <Card className="p-4 hover:shadow-elegant transition-all hover:scale-[1.02] cursor-pointer group h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {analysis.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{analysis.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {analysis.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Özelliklerimiz</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="p-6 hover:shadow-elegant transition-all group"
              >
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <Card className="p-8 mb-12 shadow-elegant">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nasıl Çalışır?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Ücretsiz Kaydol</h3>
              <p className="text-muted-foreground">
                E-posta veya sosyal medya hesabınızla hızlıca kayıt olun
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Analiz Seç</h3>
              <p className="text-muted-foreground">
                9 farklı analiz türünden size uygun olanı seçin
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Keşfet & Paylaş</h3>
              <p className="text-muted-foreground">
                Sonuçları inceleyin, arkadaşlarınızla paylaşın
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">9</div>
            <div className="text-sm text-muted-foreground">Analiz Türü</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">AI</div>
            <div className="text-sm text-muted-foreground">Destekli</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">20+</div>
            <div className="text-sm text-muted-foreground">Rozet</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">%100</div>
            <div className="text-sm text-muted-foreground">Gizlilik</div>
          </Card>
        </div>

        {/* Social & App Store Links */}
        <Card className="p-8 mb-12 shadow-elegant text-center">
          <h2 className="text-2xl font-bold mb-6">Bizi Takip Edin</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button variant="outline" asChild>
              <a 
                href="https://instagram.com/stellara.app" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a 
                href="https://twitter.com/stellaraapp" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Twitter / X
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a 
                href="https://tiktok.com/@stellara.app" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                TikTok
              </a>
            </Button>
          </div>
          
          <p className="text-muted-foreground mb-4">Yakında App Store ve Google Play'de!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" disabled>
              App Store (Yakında)
            </Button>
            <Button variant="secondary" disabled>
              Google Play (Yakında)
            </Button>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>© 2024 Stellara. Tüm hakları saklıdır.</p>
          <div className="flex justify-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Gizlilik Politikası
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Kullanım Şartları
            </Link>
            <Link to="/kvkk" className="hover:text-primary transition-colors">
              KVKK
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              İletişim
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
