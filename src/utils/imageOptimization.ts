/**
 * Image optimization utilities
 * Reduces bundle size by optimizing image loading
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Generate optimized image URL for Supabase Storage
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;
  
  // If it's a Supabase storage URL, add transformation parameters
  if (url.includes('supabase.co/storage')) {
    const transformParams = new URLSearchParams();
    if (width) transformParams.set('width', width.toString());
    if (height) transformParams.set('height', height.toString());
    transformParams.set('quality', quality.toString());
    transformParams.set('format', format);
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${transformParams.toString()}`;
  }
  
  return url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  url: string | null | undefined,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  if (!url) return '';
  
  return widths
    .map(width => `${getOptimizedImageUrl(url, { width })} ${width}w`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}
