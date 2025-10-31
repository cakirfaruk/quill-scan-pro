import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Brain, Target, Shield, Zap, Users, Award } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "AI Destekli Analiz",
      description: "Gelişmiş yapay zeka algoritmaları ile hassas ve detaylı el yazısı analizi",
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Grafologi Bilimi",
      description: "Yüzyıllardır geliştirilen grafologi biliminin modern teknoloji ile birleşimi",
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
      title: "Uyum Analizi",
      description: "İki kişinin el yazısını karşılaştırarak uyum analizleri yapın",
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Profesyonel Raporlar",
      description: "Detaylı ve anlaşılır raporlarla kişilik özelliklerini keşfedin",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            El Yazısı Analizi Hakkında
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Grafologi bilimi ve yapay zeka teknolojisinin gücünü birleştirerek, 
            el yazısından kişilik özelliklerini ortaya çıkarıyoruz
          </p>
        </div>

        {/* What is Graphology */}
        <Card className="p-8 mb-12 shadow-elegant">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Grafologi Nedir?
          </h2>
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Grafologi, el yazısını inceleyerek kişilik özelliklerini, duygusal durumları ve 
              davranış kalıplarını analiz eden bir bilim dalıdır. El yazısındaki her detay - 
              harflerin boyutu, eğimi, basıncı, kelimelerin aralığı - kişinin karakteri 
              hakkında ipuçları taşır.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Bizim platformumuz, bu yüzyıllık bilgiyi modern yapay zeka teknolojisi ile 
              birleştirerek, dakikalar içinde detaylı ve güvenilir analizler sunmaktadır.
            </p>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Özelliklerimiz</h2>
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
              <h3 className="font-semibold text-lg mb-2">El Yazısını Yükle</h3>
              <p className="text-muted-foreground">
                El yazısı örneğinizi fotoğraflayın veya tarayın ve sistemimize yükleyin
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Konuları Seç</h3>
              <p className="text-muted-foreground">
                İlgilendiğiniz kişilik özelliklerini ve analiz konularını seçin
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Sonuçları İncele</h3>
              <p className="text-muted-foreground">
                Detaylı analiz raporunuzu görüntüleyin ve kişilik özelliklerini keşfedin
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">13+</div>
            <div className="text-muted-foreground">Analiz Konusu</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">AI</div>
            <div className="text-muted-foreground">Güçlü Teknoloji</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">%100</div>
            <div className="text-muted-foreground">Gizlilik Garantisi</div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
