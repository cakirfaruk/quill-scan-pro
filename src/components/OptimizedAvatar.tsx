import { memo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export const OptimizedAvatar = memo(({
  src,
  alt,
  fallback,
  className,
  size = "md"
}: OptimizedAvatarProps) => {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && (
        <AvatarImage 
          src={src} 
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      )}
      <AvatarFallback delayMs={0}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
});

OptimizedAvatar.displayName = "OptimizedAvatar";
