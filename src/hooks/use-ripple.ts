import { MouseEvent } from "react";

interface RippleOptions {
  color?: string;
  duration?: number;
}

export const useRipple = ({ color = "rgba(255, 255, 255, 0.6)", duration = 600 }: RippleOptions = {}) => {
  const createRipple = (event: MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    const ripple = document.createElement("span");
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.style.background = color;
    ripple.classList.add("ripple");

    const existingRipple = button.getElementsByClassName("ripple")[0];
    if (existingRipple) {
      existingRipple.remove();
    }

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, duration);
  };

  return { createRipple };
};
