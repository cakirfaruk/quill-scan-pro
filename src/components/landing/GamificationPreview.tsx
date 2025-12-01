import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Trophy, Star, Zap, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const badges = [
  { icon: Trophy, name: "İlk Adım", color: "from-yellow-500 to-orange-500" },
  { icon: Star, name: "Tarot Ustası", color: "from-purple-500 to-pink-500" },
  { icon: Zap, name: "Sosyal Kelebek", color: "from-blue-500 to-cyan-500" },
  { icon: Target, name: "Görev Avcısı", color: "from-green-500 to-emerald-500" },
];

export const GamificationPreview = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.2 });

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
            <span className="text-primary">Eğlenerek</span> ilerle
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Her eylem seni bir adım daha ileriye taşır. Rozetler kazan, seviye atla!
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-card border border-border/50 rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-1">Seviye 12</h3>
                <p className="text-sm text-muted-foreground">
                  Bir sonraki seviyeye 230 XP
                </p>
              </div>
              <div className="text-4xl font-bold text-primary">2,870 XP</div>
            </div>
            <Progress value={67} className="h-3 mb-4" />
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">23</div>
                <div className="text-muted-foreground">Tamamlanan Görev</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">12</div>
                <div className="text-muted-foreground">Kazanılan Rozet</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h3 className="text-xl font-semibold mb-6 text-center">
              Kazanılabilir Rozetler
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10 from-primary/20 to-purple-500/20" />
                  <div className="bg-card border border-border/50 rounded-2xl p-6 text-center hover:border-primary/50 transition-all hover:scale-105">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center mx-auto mb-3`}
                    >
                      <badge.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-semibold">{badge.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">
                <span className="text-primary font-bold">1,234</span> kişi şu anda görevlerini tamamlıyor
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
