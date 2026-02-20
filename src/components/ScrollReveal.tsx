import { ReactNode, CSSProperties } from "react";
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

  const getTransform = (visible: boolean): string => {
    if (visible) return "translate3d(0, 0, 0)";
    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0)`;
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(${distance}px, 0, 0)`;
      case "right":
        return `translate3d(-${distance}px, 0, 0)`;
      case "none":
      default:
        return "translate3d(0, 0, 0)";
    }
  };

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(isVisible),
    transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
    willChange: "opacity, transform",
  };

  return (
    <div ref={elementRef} style={style} className={cn(className)}>
      {children}
    </div>
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

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transition: `opacity 0.8s ease-out ${delay}s`,
    willChange: "opacity",
  };

  return (
    <div ref={elementRef} style={style} className={cn(className)}>
      {children}
    </div>
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

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "scale(1)" : "scale(0.8)",
    transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
    willChange: "opacity, transform",
  };

  return (
    <div ref={elementRef} style={style} className={cn(className)}>
      {children}
    </div>
  );
};
