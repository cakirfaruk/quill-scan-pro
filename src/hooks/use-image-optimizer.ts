import { useState, useEffect } from 'react';

interface ImageOptimizerOptions {
  src: string;
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Hook to optimize images with format conversion and quality adjustment
 */
export const useImageOptimizer = ({
  src,
  quality = 75,
  width,
  height,
  format = 'webp',
}: ImageOptimizerOptions) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    // Skip optimization for base64 images
    if (src.startsWith('data:image')) {
      setOptimizedSrc(src);
      return;
    }

    // For Supabase storage URLs
    if (src.includes('supabase.co/storage')) {
      try {
        const url = new URL(src);
        
        // Add transformation parameters
        if (quality) url.searchParams.set('quality', quality.toString());
        if (width) url.searchParams.set('width', width.toString());
        if (height) url.searchParams.set('height', height.toString());
        if (format) url.searchParams.set('format', format);

        setOptimizedSrc(url.toString());
      } catch (err) {
        setError(err as Error);
        setOptimizedSrc(src);
      }
      return;
    }

    // For external URLs, use as-is
    setOptimizedSrc(src);
  }, [src, quality, width, height, format]);

  return { optimizedSrc, isLoading, error };
};

/**
 * Generate a placeholder blur data URL
 */
export const generatePlaceholder = (width = 10, height = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'hsl(var(--muted))');
  gradient.addColorStop(1, 'hsl(var(--muted-foreground) / 0.1)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.1);
};

/**
 * Check if browser supports WebP
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};
