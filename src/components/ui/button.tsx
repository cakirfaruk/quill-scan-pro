import { forwardRef, useRef, useImperativeHandle, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md hover:shadow-destructive/20 hover:-translate-y-0.5",
        outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-105 hover:from-primary/90 hover:to-accent/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ripple?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ripple = true, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    useImperativeHandle(ref, () => buttonRef.current!);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (ripple && buttonRef.current) {
        const button = buttonRef.current;
        const rippleElement = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        rippleElement.style.width = rippleElement.style.height = `${diameter}px`;
        rippleElement.style.left = `${e.clientX - rect.left - radius}px`;
        rippleElement.style.top = `${e.clientY - rect.top - radius}px`;
        rippleElement.classList.add("ripple");

        const existingRipple = button.getElementsByClassName("ripple")[0];
        if (existingRipple) {
          existingRipple.remove();
        }

        button.appendChild(rippleElement);

        setTimeout(() => rippleElement.remove(), 600);
      }

      onClick?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
