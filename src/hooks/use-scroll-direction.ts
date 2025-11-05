import { useEffect, useState, useRef } from "react";

interface UseScrollDirectionOptions {
  threshold?: number;
}

export const useScrollDirection = ({ threshold = 10 }: UseScrollDirectionOptions = {}) => {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
        ticking.current = false;
        return;
      }

      setScrollDirection(currentScrollY > lastScrollY.current ? "down" : "up");
      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { scrollDirection, scrollY };
};

export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", updatePosition, { passive: true });
    updatePosition();

    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  return scrollPosition;
};
