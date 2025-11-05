import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Heart, Bookmark, ChevronUp, ChevronDown, ZoomIn, Hand } from "lucide-react";
import { useState, useEffect } from "react";

interface GestureIndicatorProps {
  show?: boolean;
  type?: "swipe" | "pinch" | "double-tap" | "all";
}

export const GestureIndicator = ({ show = true, type = "all" }: GestureIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    // Auto hide after 5 seconds
    if (show) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const gestures = {
    swipe: (
      <div className="flex flex-col gap-3 items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-primary" />
            <ChevronUp className="w-6 h-6 text-primary animate-bounce" />
          </div>
          <span className="text-sm text-muted-foreground">Sola kaydır</span>
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-primary" />
            <ChevronDown className="w-6 h-6 text-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
          <span className="text-sm text-muted-foreground">Sağa kaydır</span>
          <Bookmark className="w-5 h-5 text-blue-500" />
        </div>
      </div>
    ),
    pinch: (
      <div className="flex items-center gap-3">
        <ZoomIn className="w-6 h-6 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">İki parmakla yakınlaştır</span>
      </div>
    ),
    "double-tap": (
      <div className="flex items-center gap-3">
        <div className="relative">
          <Smartphone className="w-6 h-6 text-primary" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Heart className="w-4 h-4 text-red-500" />
          </motion.div>
        </div>
        <span className="text-sm text-muted-foreground">Çift dokun = Beğen</span>
      </div>
    ),
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-lg border border-border rounded-2xl p-4 shadow-2xl max-w-sm"
        >
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Dokunmatik Jestler</h3>
            </div>
            
            {type === "all" ? (
              <>
                {gestures.swipe}
                <div className="h-px bg-border my-1" />
                {gestures.pinch}
                <div className="h-px bg-border my-1" />
                {gestures["double-tap"]}
              </>
            ) : (
              gestures[type]
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
