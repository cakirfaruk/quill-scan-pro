import { memo, ComponentType } from "react";
import { Link, LinkProps } from "react-router-dom";
import { useShouldPreload } from "@/hooks/use-network-info";

interface PreloadLinkProps extends LinkProps {
  preloadComponent?: ComponentType<any> & { preload?: () => Promise<any> };
}

/**
 * Enhanced Link component that preloads the target route on hover
 * Improves perceived performance by loading route code before navigation
 * Network-aware: disables preload on slow connections
 */
export const PreloadLink = memo(({ 
  preloadComponent, 
  onMouseEnter,
  onTouchStart,
  ...props 
}: PreloadLinkProps) => {
  // 📡 Check network status
  const shouldPreload = useShouldPreload();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 📡 Skip preload on slow connections
    if (shouldPreload && preloadComponent && 'preload' in preloadComponent) {
      preloadComponent.preload?.();
    }
    onMouseEnter?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    // 📡 Skip preload on slow connections  
    if (shouldPreload && preloadComponent && 'preload' in preloadComponent) {
      preloadComponent.preload?.();
    }
    onTouchStart?.(e);
  };

  return (
    <Link 
      {...props} 
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
    />
  );
});

PreloadLink.displayName = "PreloadLink";
