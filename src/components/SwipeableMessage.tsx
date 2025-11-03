import { useState, useRef } from "react";
import { Reply, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Delete
  onSwipeRight?: () => void; // Reply
  className?: string;
}

export const SwipeableMessage = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeableMessageProps) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStart = useRef<number | null>(null);
  const threshold = 80;
  const maxSwipe = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !isDragging) return;

    const currentX = e.targetTouches[0].clientX;
    let deltaX = currentX - touchStart.current;
    
    // Limit the swipe distance
    deltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    
    setOffset(deltaX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (Math.abs(offset) > threshold) {
      if (offset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset position
    setOffset(0);
    touchStart.current = null;
  };

  const showReplyIcon = offset > 30;
  const showDeleteIcon = offset < -30;

  return (
    <div className="relative overflow-hidden">
      {/* Reply icon (right swipe) */}
      {showReplyIcon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-0 animate-fade-in">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <Reply className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Delete icon (left swipe) */}
      {showDeleteIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-0 animate-fade-in">
          <div className="bg-destructive text-destructive-foreground rounded-full p-2">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={cn("relative z-10", className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
};
