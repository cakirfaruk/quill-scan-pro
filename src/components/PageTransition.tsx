import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "fade" | "slide" | "slideUp" | "scale" | "spring" | "depth";
}

const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

const transitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  slide: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  spring: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
    transition: spring
  },
  depth: {
    initial: { opacity: 0, scale: 0.95, rotateX: -10 },
    animate: { opacity: 1, scale: 1, rotateX: 0 },
    exit: { opacity: 0, scale: 1.05, rotateX: 10 },
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

export const PageTransition = ({ children, variant = "fade" }: PageTransitionProps) => {
  const location = useLocation();
  const transition = transitions[variant];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={transition.transition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// HOC for wrapping page components
export const withPageTransition = (
  Component: React.ComponentType,
  variant: "fade" | "slide" | "slideUp" | "scale" = "fade"
) => {
  return (props: any) => (
    <PageTransition variant={variant}>
      <Component {...props} />
    </PageTransition>
  );
};
