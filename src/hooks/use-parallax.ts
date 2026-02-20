import { useEffect, useState, RefObject } from "react";

interface ParallaxOptions {
  speed?: number;
  direction?: "up" | "down";
}

export const useParallax = (
  elementRef: RefObject<HTMLElement>,
  { speed = 0.5, direction = "up" }: ParallaxOptions = {}
) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!elementRef.current) return;

        const scrollPosition = window.scrollY;
        // Read layout properties in a single rAF to avoid forced reflow
        const elementTop = elementRef.current.offsetTop;
        const elementHeight = elementRef.current.offsetHeight;
        const windowHeight = window.innerHeight;

        // Only apply parallax when element is in viewport
        if (scrollPosition + windowHeight > elementTop && scrollPosition < elementTop + elementHeight) {
          const parallaxOffset = (scrollPosition - elementTop) * speed;
          setOffset(direction === "up" ? -parallaxOffset : parallaxOffset);
        }
      });
    };

    // Use passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [elementRef, speed, direction]);

  return offset;
};

export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
};
