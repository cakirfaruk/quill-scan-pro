import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface DoubleTapLikeProps {
  onDoubleTap: () => void;
  isLiked: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DoubleTapLike = ({ onDoubleTap, isLiked, children, className = "" }: DoubleTapLikeProps) => {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });

  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;

    // Get tap position
    let x, y;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      setTapPosition({ x, y });
      setShowHeart(true);
      
      if (!isLiked) {
        onDoubleTap();
      }
      
      setTimeout(() => setShowHeart(false), 1000);
      setLastTap(0);
    } else {
      setLastTap(now);
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onClick={handleTap}
      onTouchEnd={handleTap}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
      
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.8,
              times: [0, 0.3, 1],
              ease: "easeOut"
            }}
            className="absolute pointer-events-none z-50"
            style={{
              left: tapPosition.x,
              top: tapPosition.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Heart 
              className="w-20 h-20 md:w-24 md:h-24 fill-white text-white drop-shadow-2xl" 
              strokeWidth={1.5}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
