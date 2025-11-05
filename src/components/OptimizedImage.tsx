import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean; // Skip lazy loading for above-fold images
  aspectRatio?: string; // e.g., "16/9" for layout stability
  sizes?: string; // Responsive sizes
  quality?: number; // Image quality (1-100)
}

/**
 * Optimized image component with:
 * - WebP format support with fallback
 * - Lazy loading with Intersection Observer
 * - Progressive loading (blur-up technique)
 * - Layout shift prevention
 * - Error handling
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  fallback,
  priority = false,
  aspectRatio,
  sizes = "100vw",
  quality = 75
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Intersection Observer for lazy loading
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
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Convert image to WebP if possible
  useEffect(() => {
    if (!src || !isInView) return;

    // Check if it's a base64 image or external URL
    if (src.startsWith('data:image') || src.startsWith('http')) {
      setImageSrc(src);
      return;
    }

    // For Supabase storage URLs, we can add transformations
    if (src.includes('supabase.co/storage')) {
      const url = new URL(src);
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', 'webp');
      setImageSrc(url.toString());
    } else {
      setImageSrc(src);
    }
  }, [src, isInView, quality]);

  if (!src || error) {
    return <>{fallback}</>;
  }

  return (
    <div 
      className={cn("relative overflow-hidden bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blur placeholder while loading */}
      {!loaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc || ''}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={aspectRatio ? { aspectRatio } : undefined}
      />
    </div>
  );
};
