import { ReactNode, useState, useRef } from "react";
import { Heart, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeablePostCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;  // Save
  onSwipeRight?: () => void; // Like
  isLiked?: boolean;
  isSaved?: boolean;
}

export const SwipeablePostCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  isLiked = false,
  isSaved = false,
}: SwipeablePostCardProps) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showLeftIcon, setShowLeftIcon] = useState(false);
  const [showRightIcon, setShowRightIcon] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const threshold = 100;

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !isDragging) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const deltaX = currentX - touchStart.current.x;
    const deltaY = currentY - touchStart.current.y;

    // Only allow horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setOffset(deltaX);
      
      // Show icons based on swipe direction and distance
      if (deltaX > 30) {
        setShowRightIcon(true);
        setShowLeftIcon(false);
      } else if (deltaX < -30) {
        setShowLeftIcon(true);
        setShowRightIcon(false);
      } else {
        setShowRightIcon(false);
        setShowLeftIcon(false);
      }
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);

    if (Math.abs(offset) > threshold) {
      if (offset > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    // Reset
    setOffset(0);
    setShowRightIcon(false);
    setShowLeftIcon(false);
    touchStart.current = null;
  };

  return (
    <div className="relative overflow-hidden touch-pan-y">
      {/* Left swipe indicator (Save) */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start pl-8 pointer-events-none z-10 transition-all duration-200",
          showLeftIcon && offset < -30 ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-blue-500 rounded-full p-4 animate-pulse">
          <Bookmark className={cn("w-8 h-8 text-white", isSaved && "fill-white")} />
        </div>
      </div>

      {/* Right swipe indicator (Like) */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-8 pointer-events-none z-10 transition-all duration-200",
          showRightIcon && offset > 30 ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-red-500 rounded-full p-4 animate-pulse">
          <Heart className={cn("w-8 h-8 text-white", isLiked && "fill-white")} />
        </div>
      </div>

      {/* Card content */}
      <div
        className={cn(
          "transition-transform duration-200 ease-out",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          transform: `translateX(${offset}px)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
