import { forwardRef, type ElementRef, type ComponentPropsWithoutRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

interface AvatarProps extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  withGlow?: boolean;
  withPulse?: boolean;
  withRing?: boolean;
  interactive?: boolean;
}

const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, withGlow = false, withPulse = false, withRing = false, interactive = true, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      "transition-all duration-300",
      interactive && "cursor-pointer",
      withGlow && "hover:shadow-lg hover:shadow-primary/40 hover:scale-110",
      withPulse && "animate-pulse-glow",
      withRing && "ring-2 ring-primary/20 ring-offset-2 ring-offset-background hover:ring-primary/60",
      interactive && !withGlow && "hover:scale-105 hover:ring-2 hover:ring-primary/30",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image 
    ref={ref} 
    className={cn(
      "aspect-square h-full w-full object-cover transition-transform duration-300",
      className
    )} 
    {...props} 
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      "transition-all duration-300",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Skeleton Avatar Component
interface SkeletonAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SkeletonAvatar = ({ className, size = "md" }: SkeletonAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div
      className={cn(
        "relative rounded-full bg-muted overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 shimmer-effect" />
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary/5 to-accent/5" />
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback, SkeletonAvatar };
