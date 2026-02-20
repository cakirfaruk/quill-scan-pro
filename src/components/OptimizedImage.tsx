import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/image-optimizer";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string; // Container class
  imgClassName?: string; // Image element class
  fallback?: React.ReactNode;
  priority?: boolean;
  aspectRatio?: string;
  sizes?: string;
  quality?: number;
  width?: number; // Target width for server-side resize
  height?: number; // Target height for server-side resize
  objectFit?: "cover" | "contain";
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  imgClassName,
  fallback,
  priority = false,
  aspectRatio,
  sizes = "100vw",
  quality = 75,
  width,
  height,
  objectFit = "cover"
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!src || !isInView) return;

    if (src.startsWith('data:image')) {
      setImageSrc(src);
      return;
    }

    // Generate optimized URL using our utility
    // Only optimize if we have at least width or height
    if (width || height || src.includes('supabase.co')) {
      const optimized = getOptimizedImageUrl(src, width || 800, height || 800, {
        quality,
        resize: objectFit,
        format: 'webp'
      });
      setImageSrc(optimized || src);
    } else {
      setImageSrc(src);
    }
  }, [src, isInView, quality, width, height, objectFit]);

  if (!src || error) {
    return <>{fallback || <div className={cn("bg-muted flex items-center justify-center text-muted-foreground text-xs", className)}>Görsel Yok</div>}</>;
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
      )}

      <img
        ref={imgRef}
        src={imageSrc || ''}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={aspectRatio ? { aspectRatio } : undefined}
      />
    </div>
  );
};
