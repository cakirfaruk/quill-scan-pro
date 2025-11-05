import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  triggerOnce?: boolean;
  threshold?: number;
}

export const ScrollReveal = ({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 30,
  triggerOnce = true,
  threshold = 0.1,
}: ScrollRevealProps) => {
  const { elementRef, isVisible } = useScrollReveal({ 
    threshold, 
    triggerOnce,
    rootMargin: "0px 0px -50px 0px"
  });

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, opacity: 0 };
      case "down":
        return { y: -distance, opacity: 0 };
      case "left":
        return { x: distance, opacity: 0 };
      case "right":
        return { x: -distance, opacity: 0 };
      case "none":
      default:
        return { opacity: 0 };
    }
  };

  return (
    <motion.div
      ref={elementRef}
      initial={getInitialPosition()}
      animate={
        isVisible
          ? { x: 0, y: 0, opacity: 1 }
          : getInitialPosition()
      }
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface ScrollStaggerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  childDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export const ScrollStagger = ({
  children,
  className = "",
  staggerDelay = 0.1,
  childDelay = 0,
  direction = "up",
}: ScrollStaggerProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          direction={direction}
          delay={childDelay + index * staggerDelay}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
};

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollFade = ({
  children,
  className = "",
  delay = 0,
}: ScrollFadeProps) => {
  const { elementRef, isVisible } = useScrollReveal({ triggerOnce: true });

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollScale = ({
  children,
  className = "",
  delay = 0,
}: ScrollScaleProps) => {
  const { elementRef, isVisible } = useScrollReveal({ triggerOnce: true });

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        isVisible
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.8 }
      }
      transition={{ duration: 0.5, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};
