import { ReactNode, CSSProperties, useEffect, useState } from "react";

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
      <div
        className={`rounded-full border-b-2 border-primary ${sizeClasses[size]} animate-spin`}
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
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-[9999] shadow-lg shadow-primary/50 animate-fade-in"
          style={{ transformOrigin: "0%", animation: "progress-bar 0.3s ease-out forwards" }}
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const directions: Record<string, CSSProperties> = {
    up: { transform: isVisible ? "translateY(0)" : "translateY(20px)" },
    down: { transform: isVisible ? "translateY(0)" : "translateY(-20px)" },
    left: { transform: isVisible ? "translateX(0)" : "translateX(20px)" },
    right: { transform: isVisible ? "translateX(0)" : "translateX(-20px)" }
  };

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        ...directions[direction],
        transition: `opacity 0.5s ease-in-out, transform 0.5s ease-in-out`,
      }}
    >
      {children}
    </div>
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
    <div>
      {children}
    </div>
  );
};

export const StaggerItem = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
      }}
    >
      {children}
    </div>
  );
};
