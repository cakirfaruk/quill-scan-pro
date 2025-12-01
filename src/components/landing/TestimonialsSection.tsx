import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Star, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Ayşe K.",
    role: "Koç Burcu",
    avatar: "from-pink-500 to-rose-500",
    rating: 5,
    text: "Hayatımda ilk defa bu kadar derin bir bağ kurabileceğim insanlarla tanıştım. Tarot yorumları gerçekten şaşırtıcı derecede isabetli!",
  },
  {
    name: "Mehmet Y.",
    role: "Akrep Burcu",
    avatar: "from-purple-500 to-indigo-500",
    rating: 5,
    text: "Uygulamadaki eşleşme sistemi harika. %89 uyumlu biriyle tanıştım ve şimdi 6 aydır birlikteyiz. Teşekkürler!",
  },
  {
    name: "Zeynep D.",
    role: "Başak Burcu",
    avatar: "from-blue-500 to-cyan-500",
    rating: 5,
    text: "Sosyal özellikler çok güzel düşünülmüş. Hem yeni arkadaşlıklar kurdum hem de günlük burç yorumlarıyla günüme yön veriyorum.",
  },
  {
    name: "Can S.",
    role: "Aslan Burcu",
    avatar: "from-yellow-500 to-orange-500",
    rating: 5,
    text: "Oyunlaştırma sistemi beni bağımlısı yaptı! Her gün görevleri tamamlamak için sabırsızlanıyorum. Harika bir deneyim.",
  },
];

export const TestimonialsSection = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      ref={elementRef}
      className="py-24 bg-gradient-to-b from-background/50 to-background relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Kullanıcılarımız <span className="text-primary">ne diyor?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerçek hikayeler, gerçek deneyimler
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10 from-primary/20 to-purple-500/20" />
                <div className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all hover:scale-105 h-full">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatar}`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
