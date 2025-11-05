import { useRef, useEffect, MouseEvent } from "react";

interface MagneticOptions {
  strength?: number;
  enabled?: boolean;
}

export const useMagnetic = <T extends HTMLElement>({ 
  strength = 0.3, 
  enabled = true 
}: MagneticOptions = {}) => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    let animationFrameId: number;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
        const maxDistance = 100;

        if (distance < maxDistance) {
          const offsetX = distanceX * strength;
          const offsetY = distanceY * strength;

          element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
          element.style.transform = "translate(0, 0)";
        }
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      element.style.transform = "translate(0, 0)";
    };

    element.addEventListener("mousemove", handleMouseMove as any);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove as any);
      element.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [strength, enabled]);

  return elementRef;
};
