import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedDivProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-fade-in", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const FadeInUp = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-fade-in-up", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const FadeInDown = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-fade-in-down", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const ScaleIn = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-scale-in", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const BounceIn = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-bounce-in", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const SlideInRight = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-slide-in-right", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const SlideInLeft = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("animate-slide-in-left", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// Stagger children animations
interface StaggerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: "fade-in" | "fade-in-up" | "scale-in" | "bounce-in";
}

export const StaggerChildren = ({ 
  children, 
  className, 
  staggerDelay = 100,
  animation = "fade-in-up"
}: StaggerProps) => (
  <>
    {children.map((child, index) => (
      <div
        key={index}
        className={cn(`animate-${animation}`, className)}
        style={{ animationDelay: `${index * staggerDelay}ms` }}
      >
        {child}
      </div>
    ))}
  </>
);

// Interactive hover effects
export const HoverScale = ({ children, className }: AnimatedDivProps) => (
  <div className={cn("hover-scale cursor-pointer", className)}>
    {children}
  </div>
);

export const HoverLift = ({ children, className }: AnimatedDivProps) => (
  <div className={cn("hover-lift cursor-pointer", className)}>
    {children}
  </div>
);

export const PressEffect = ({ children, className }: AnimatedDivProps) => (
  <div className={cn("press-effect cursor-pointer", className)}>
    {children}
  </div>
);

// Card with animation
export const AnimatedCard = ({ children, className, delay = 0 }: AnimatedDivProps) => (
  <div
    className={cn("card-hover animate-fade-in-up", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);
