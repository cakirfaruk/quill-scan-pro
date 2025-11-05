import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <motion.div
        className={`rounded-full border-b-2 border-primary ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

interface ProgressBarProps {
  isAnimating: boolean;
}

export const RouteProgressBar = ({ isAnimating }: ProgressBarProps) => {
  return (
    <>
      {isAnimating && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-[9999] shadow-lg shadow-primary/50"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: 1, 
            opacity: 1,
            transition: { 
              duration: 0.3, 
              ease: "easeOut" as const 
            }
          }}
          exit={{ 
            opacity: 0,
            transition: { 
              duration: 0.2 
            }
          }}
          style={{ transformOrigin: "0%" }}
        />
      )}
    </>
  );
};

interface FadeInWrapperProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export const FadeInWrapper = ({ 
  children, 
  delay = 0, 
  direction = "up" 
}: FadeInWrapperProps) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: "easeInOut" as const
      }}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
}

export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1 
}: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: "easeInOut" as const
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};
