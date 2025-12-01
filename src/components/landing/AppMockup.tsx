import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Star } from "lucide-react";

const screens = [
  {
    id: "tarot",
    title: "Tarot Falı",
    content: (
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-lg mb-2">Bugünün Kartın</h3>
          <p className="text-sm text-muted-foreground">
            İmparatoriçe - Bolluk ve yaratıcılık
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ delay: i * 0.2 }}
              className="aspect-[2/3] bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "match",
    title: "Eşleşme",
    content: (
      <div className="p-4">
        <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <h3 className="text-xl font-bold mb-1">Ayşe, 28</h3>
            <p className="text-sm text-muted-foreground mb-2">
              5 km uzakta • Koç burcu
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>%92 Uyum</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
            Çevrimiçi
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "feed",
    title: "Sosyal Feed",
    content: (
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500" />
            <div>
              <p className="font-semibold text-sm">Mehmet</p>
              <p className="text-xs text-muted-foreground">2 saat önce</p>
            </div>
          </div>
          <p className="text-sm mb-3">
            Bugünkü tarot falım inanılmazdı! 🔮✨
          </p>
          <div className="flex gap-4 text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-xs">24</span>
            </button>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">8</span>
            </button>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    ),
  },
];

export const AppMockup = () => {
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* iPhone Frame */}
      <div className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="relative w-full h-full bg-background rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-background/80 backdrop-blur-sm px-6 flex items-center justify-between text-xs z-10">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 border border-current rounded-sm" />
            </div>
          </div>

          {/* Screen Content */}
          <div className="pt-10 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                {screens[currentScreen].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Screen Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {screens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentScreen
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Labels */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -left-8 top-20 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-lg"
      >
        Tarot ✨
      </motion.div>
      
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className="absolute -right-8 top-1/3 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold shadow-lg"
      >
        Eşleşme ❤️
      </motion.div>
      
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        className="absolute -left-12 bottom-32 px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-semibold shadow-lg"
      >
        Sosyal 🎉
      </motion.div>
    </div>
  );
};
