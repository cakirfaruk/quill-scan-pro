import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Users,
  Trophy,
  Moon,
  Camera,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Mistik Analizler",
    description: "Tarot, astroloji, numeroloji ve daha fazlası",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "Akıllı Eşleşme",
    description: "Kozmik uyum algoritması ile gerçek bağlantılar",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageCircle,
    title: "Anlık Mesajlaşma",
    description: "Sesli mesaj, GIF, sticker ve daha fazlası",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Sosyal Topluluk",
    description: "Hikayeni paylaş, dostluklar kur",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Trophy,
    title: "Oyunlaştırma",
    description: "Görevler, rozetler ve seviye sistemi",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Moon,
    title: "Günlük Burç",
    description: "Her gün özelleştirilmiş burç yorumları",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Camera,
    title: "Hikayeler",
    description: "Anlarını paylaş, keşfet",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Canlı Etkinlikler",
    description: "Grup sohbetleri ve özel etkinlikler",
    gradient: "from-orange-500 to-red-500",
  },
];

export const FeaturesSection = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <section
      ref={elementRef}
      className="py-24 bg-gradient-to-b from-background to-background/50"
    >
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Seni bekleyen <span className="text-primary">sihirli dünya</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Her özellik, seni daha iyi tanıman ve gerçek bağlantılar kurman için tasarlandı
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.6 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10 from-primary/20 to-purple-500/20" />
              <div className="bg-card border border-border/50 rounded-2xl p-6 h-full hover:border-primary/50 transition-all hover:scale-105 hover:shadow-xl">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
