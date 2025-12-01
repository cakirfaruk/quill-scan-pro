import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Star, Flame, Trophy, Zap, Sparkles } from "lucide-react";
import { FloatingNotifications } from "./FloatingNotifications";

// Import tarot images
import imparatoriceImg from "@/assets/tarot/imparatorice.png";
import buyucuImg from "@/assets/tarot/buyucu.png";
import gunesImg from "@/assets/tarot/gunes.png";
import cardBackImg from "@/assets/tarot/card-back.png";

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
          {[
            { img: imparatoriceImg, delay: 0 },
            { img: buyucuImg, delay: 0.2 },
            { img: gunesImg, delay: 0.4 },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ 
                delay: card.delay,
                duration: 0.6,
                ease: "easeOut"
              }}
              className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <img 
                src={card.img} 
                alt="Tarot Card" 
                className="w-full h-full object-cover"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: card.delay }}
                className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent"
              />
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "match",
    title: "Eşleşme",
    content: (
      <div className="p-4 h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 1, x: 0 }}
          animate={{ 
            scale: [1, 1.05, 1],
            x: [0, -20, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
          className="relative aspect-[3/4] w-full max-w-[240px] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <h3 className="text-xl font-bold mb-1">Ayşe, 28</h3>
              <p className="text-sm text-muted-foreground mb-2">
                5 km uzakta • Koç burcu
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>%92 Uyum</span>
              </div>
            </motion.div>
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
            Çevrimiçi
          </div>
          
          {/* Heart animation */}
          <motion.div
            animate={{ 
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Heart className="w-20 h-20 text-pink-500 fill-pink-500" />
          </motion.div>
        </motion.div>
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <p className="font-semibold text-sm">Mehmet</p>
              <p className="text-xs text-muted-foreground">2 saat önce</p>
            </div>
          </div>
          <p className="text-sm mb-3">
            Bugünkü tarot falım inanılmazdı! 🔮✨
          </p>
          <div className="flex gap-4 text-muted-foreground">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
              </motion.div>
              <span className="text-xs">24</span>
            </motion.button>
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
  {
    id: "coffee",
    title: "Kahve Falı",
    content: (
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-lg mb-2">Fincanını Yorumla</h3>
          <p className="text-sm text-muted-foreground">
            Mistik semboller keşfediliyor...
          </p>
        </div>
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-900 to-amber-700 shadow-xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sparkles className="w-12 h-12 text-amber-300" />
          </motion.div>
        </div>
        <div className="space-y-2 text-center text-sm">
          <p>🦋 Kelebek - Değişim yaklaşıyor</p>
          <p>🌙 Ay - İçsel güç artıyor</p>
          <p>⭐ Yıldız - Şans sizinle</p>
        </div>
      </div>
    ),
  },
  {
    id: "compatibility",
    title: "Uyum Analizi",
    content: (
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <h3 className="font-semibold text-lg mb-6">Burç Uyumu</h3>
        <div className="relative w-48 h-48">
          {/* Zodiac circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-bold shadow-lg">
              ♈
            </div>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center text-white font-bold shadow-lg">
              ♎
            </div>
          </motion.div>
          
          {/* Center compatibility score */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex flex-col items-center justify-center text-white shadow-xl"
            >
              <span className="text-2xl font-bold">92%</span>
              <span className="text-xs">Uyum</span>
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "messages",
    title: "Mesajlar",
    content: (
      <div className="p-4 space-y-3">
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%]">
            <p className="text-sm">Merhaba! Nasılsın?</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[70%]">
            <p className="text-sm">İyiyim, sen?</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%]">
            <p className="text-sm">Harika! Bugün...</p>
          </div>
        </div>
        <div className="flex justify-start">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="bg-muted rounded-2xl px-4 py-2 flex gap-1"
          >
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="w-2 h-2 bg-primary rounded-full" />
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "stories",
    title: "Hikayeler",
    content: (
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[
            { name: "Sen", color: "from-primary to-purple-500", hasNew: true },
            { name: "Ayşe", color: "from-pink-500 to-rose-500", hasNew: true },
            { name: "Mehmet", color: "from-blue-500 to-cyan-500", hasNew: true },
            { name: "Zeynep", color: "from-green-500 to-emerald-500", hasNew: false },
          ].map((story, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${story.color} p-0.5`}>
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {story.name[0]}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{story.name}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-12 h-12 mx-auto mb-2 text-orange-500" />
          </motion.div>
          <p className="text-sm font-semibold">Hikayeni Paylaş</p>
          <p className="text-xs text-muted-foreground mt-1">Arkadaşların görsün</p>
        </div>
      </div>
    ),
  },
  {
    id: "missions",
    title: "Günlük Görevler",
    content: (
      <div className="p-4 space-y-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-lg mb-2">Günlük Görevler</h3>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-primary">1,250</span>
            <span className="text-sm text-muted-foreground">XP</span>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Seviye 8</span>
            <span>75%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "75%" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-purple-500"
            />
          </div>
        </div>

        {/* Missions */}
        <div className="space-y-2">
          {[
            { text: "Günlük fal bak", completed: true, xp: 50 },
            { text: "3 yeni eşleşme", completed: true, xp: 100 },
            { text: "Profil tamamla", completed: false, xp: 75 },
          ].map((mission, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                mission.completed ? "bg-primary/10" : "bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                {mission.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                ) : (
                  <div className="w-5 h-5 rounded border-2 border-muted-foreground" />
                )}
                <span className={`text-sm ${mission.completed ? "line-through text-muted-foreground" : ""}`}>
                  {mission.text}
                </span>
              </div>
              <span className="text-xs font-semibold text-primary">+{mission.xp} XP</span>
            </motion.div>
          ))}
        </div>

        {/* Confetti effect for completed missions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * 200, opacity: 1 }}
              animate={{ y: 400, opacity: 0 }}
              transition={{ duration: 2, delay: Math.random() * 0.5 }}
              className="absolute w-2 h-2 bg-yellow-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    ),
  },
];

export const AppMockup = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Notifications */}
      <FloatingNotifications />

      {/* iPhone Frame with 3D effect */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
      >
        {/* Light reflection effect */}
        <motion.div
          className="absolute inset-0 rounded-[3rem] pointer-events-none"
          style={{
            background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1) 0%, transparent 50%)",
          }}
        />

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
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full"
              >
                {screens[currentScreen].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Screen Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {screens.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentScreen(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`h-2 rounded-full transition-all ${
                  index === currentScreen
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
