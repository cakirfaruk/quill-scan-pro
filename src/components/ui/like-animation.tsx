import { Heart } from "lucide-react";
import { useState, useCallback } from "react";

interface LikeAnimationProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: number;
  particleCount?: number;
}

export const LikeAnimation = ({
  isLiked,
  onToggle,
  size = 24,
  particleCount = 12
}: LikeAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    if (!isLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    onToggle();
  }, [isLiked, onToggle]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        onClick={handleClick}
        className="relative z-10 focus:outline-none hover:scale-110 active:scale-90 transition-transform"
      >
        <div
          className={isAnimating ? "animate-bounce" : ""}
          style={{ transition: "transform 0.3s ease-out" }}
        >
          <Heart
            size={size}
            className={isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"}
          />
        </div>
      </button>

      {/* Ring effect */}
      {isAnimating && (
        <div
          className="absolute inset-0 rounded-full border-2 border-destructive pointer-events-none"
          style={{
            animation: "like-ring 0.6s ease-out forwards",
          }}
        />
      )}

      <style>{`
        @keyframes like-ring {
          from {
            transform: scale(0.8);
            opacity: 0.8;
          }
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
