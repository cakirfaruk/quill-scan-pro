import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState } from "react";
import { Trash2, Archive, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onTrigger: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

const defaultLeftAction: SwipeAction = {
  icon: <Trash2 className="w-6 h-6" />,
  label: "Delete",
  color: "bg-destructive",
  onTrigger: () => {}
};

const defaultRightAction: SwipeAction = {
  icon: <Archive className="w-6 h-6" />,
  label: "Archive",
  color: "bg-primary",
  onTrigger: () => {}
};

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = defaultLeftAction,
  rightAction = defaultRightAction,
  threshold = 100,
  className,
  disabled = false
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -threshold, 0, threshold, 200], [0, 1, 1, 1, 0]);
  const leftBgOpacity = useTransform(x, [0, -threshold], [0, 1]);
  const rightBgOpacity = useTransform(x, [0, threshold], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    
    if (offset < -threshold) {
      if (leftAction?.onTrigger) leftAction.onTrigger();
      if (onSwipeLeft) onSwipeLeft();
    } else if (offset > threshold) {
      if (rightAction?.onTrigger) rightAction.onTrigger();
      if (onSwipeRight) onSwipeRight();
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Action Background */}
      <motion.div
        style={{ opacity: leftBgOpacity }}
        className={cn(
          "absolute inset-y-0 left-0 w-full flex items-center justify-start px-6",
          leftAction.color
        )}
      >
        <div className="flex items-center gap-2 text-white">
          {leftAction.icon}
          <span className="font-medium">{leftAction.label}</span>
        </div>
      </motion.div>

      {/* Right Action Background */}
      <motion.div
        style={{ opacity: rightBgOpacity }}
        className={cn(
          "absolute inset-y-0 right-0 w-full flex items-center justify-end px-6",
          rightAction.color
        )}
      >
        <div className="flex items-center gap-2 text-white">
          <span className="font-medium">{rightAction.label}</span>
          {rightAction.icon}
        </div>
      </motion.div>

      {/* Draggable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className={cn(
          "relative bg-card cursor-grab active:cursor-grabbing",
          isDragging && "shadow-2xl"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Preset actions
export const swipeActions = {
  delete: {
    icon: <Trash2 className="w-6 h-6" />,
    label: "Sil",
    color: "bg-destructive"
  },
  archive: {
    icon: <Archive className="w-6 h-6" />,
    label: "Arşivle",
    color: "bg-blue-500"
  },
  favorite: {
    icon: <Star className="w-6 h-6" />,
    label: "Favorile",
    color: "bg-amber-500"
  },
  like: {
    icon: <Heart className="w-6 h-6" />,
    label: "Beğen",
    color: "bg-pink-500"
  }
};
