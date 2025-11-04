import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Optimized image component with lazy loading and error handling
 */
export const OptimizedImage = ({ src, alt, className, fallback }: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
};
