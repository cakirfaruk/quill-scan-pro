import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Heart, Users, Sparkles } from "lucide-react";

export const ProblemSection = () => {
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
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ruhunu anlayan birine{" "}
            <span className="text-primary">rastlamak</span> zor mu?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-16">
            Binlerce profil arasında kaybolmak yerine, evrenin rehberliğinde 
            sana gerçekten uygun insanlarla tanış.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Derin Bağlantılar</h3>
              <p className="text-sm text-muted-foreground">
                Yüzeysel sohbetler değil, ruhunu anlayan gerçek dostluklar
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Kozmik Uyum</h3>
              <p className="text-sm text-muted-foreground">
                Astroloji, tarot ve numeroloji ile uyum puanları
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Güvenli Topluluk</h3>
              <p className="text-sm text-muted-foreground">
                Pozitif, destekleyici ve otantik bir topluluk
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
