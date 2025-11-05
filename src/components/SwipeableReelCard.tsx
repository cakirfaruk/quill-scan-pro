import { ReactNode, useState, useRef } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableReelCardProps {
  children: ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
}

export const SwipeableReelCard = ({
  children,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
}: SwipeableReelCardProps) => {
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<number>(0);
  const threshold = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };

    // Double tap detection
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      onDoubleTap?.();
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
    lastTap.current = now;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaY = touchStart.current.y - touchEnd.y;
    const deltaX = touchStart.current.x - touchEnd.x;

    // Only vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > threshold) {
        onSwipeUp?.();
      } else if (deltaY < -threshold) {
        onSwipeDown?.();
      }
    }

    touchStart.current = null;
  };

  return (
    <div
      className="relative w-full h-full touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
      
      {/* Double tap like animation */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <Heart className="w-32 h-32 text-white fill-red-500 animate-scale-in opacity-0" />
        </div>
      )}
    </div>
  );
};
