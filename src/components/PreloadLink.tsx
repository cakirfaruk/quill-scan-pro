import { memo, ComponentType } from "react";
import { Link, LinkProps } from "react-router-dom";

interface PreloadLinkProps extends LinkProps {
  preloadComponent?: ComponentType<any> & { preload?: () => Promise<any> };
}

/**
 * Enhanced Link component that preloads the target route on hover
 * Improves perceived performance by loading route code before navigation
 */
export const PreloadLink = memo(({ 
  preloadComponent, 
  onMouseEnter,
  onTouchStart,
  ...props 
}: PreloadLinkProps) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (preloadComponent && 'preload' in preloadComponent) {
      preloadComponent.preload?.();
    }
    onMouseEnter?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    if (preloadComponent && 'preload' in preloadComponent) {
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
