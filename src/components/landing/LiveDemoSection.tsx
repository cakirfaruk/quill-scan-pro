import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { AppMockup } from "./AppMockup";

export const LiveDemoSection = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      id="live-demo"
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
            Deneyimle, keşfet, <span className="text-primary">bağlan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Her gün yeni bir keşif. Tarot falından astroloji analizine, 
            arkadaşlıktan aşka kadar tüm yolculuğun burada.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex justify-center"
        >
          <AppMockup />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Mistik Analiz</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Aktif Kullanıcı</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">%92</div>
            <div className="text-sm text-muted-foreground">Memnuniyet Oranı</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
