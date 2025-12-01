import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Star, TrendingUp, Users, Heart } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50,000+",
    label: "Mutlu Kullanıcı",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    value: "12,000+",
    label: "Başarılı Eşleşme",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Kullanıcı Puanı",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: TrendingUp,
    value: "%300",
    label: "Yıllık Büyüme",
    color: "from-green-500 to-emerald-500",
  },
];

export const SocialProofSection = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      ref={elementRef}
      className="py-24 bg-gradient-to-b from-background/50 to-background"
    >
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Binlerce kişi</span> zaten keşfetti
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sen de bu büyüyen topluluğa katıl, hikayeni paylaş
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10 from-primary/20 to-purple-500/20" />
              <div className="bg-card border border-border/50 rounded-2xl p-6 text-center hover:border-primary/50 transition-all hover:scale-105">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Avatars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 flex justify-center items-center gap-4"
        >
          <div className="flex -space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={isVisible ? { scale: 1 } : {}}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 border-2 border-background"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">2,430 kişi</span> bugün katıldı
          </p>
        </motion.div>
      </div>
    </section>
  );
};
