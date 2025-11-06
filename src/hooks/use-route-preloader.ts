import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route preloading strategy configurations
 */
interface RoutePreloadConfig {
  [key: string]: {
    preloadRoutes: string[]; // Routes to preload when on this route
    priority: 'high' | 'medium' | 'low';
  };
}

/**
 * Smart route preloading hook
 * Preloads related routes based on current location and user behavior patterns
 */
export function useRoutePreloader(
  routeComponents: { [path: string]: any },
  config?: RoutePreloadConfig
) {
  const location = useLocation();
  const preloadedRef = useRef<Set<string>>(new Set());
  const idleCallbackIdRef = useRef<number>();

  // Default intelligent preload configuration
  const defaultConfig: RoutePreloadConfig = {
    '/': {
      preloadRoutes: ['/feed', '/auth'],
      priority: 'high'
    },
    '/auth': {
      preloadRoutes: ['/feed', '/profile'],
      priority: 'high'
    },
    '/feed': {
      preloadRoutes: ['/profile', '/messages', '/explore', '/tarot'],
      priority: 'high'
    },
    '/messages': {
      preloadRoutes: ['/profile', '/feed', '/friends'],
      priority: 'high'
    },
    '/profile': {
      preloadRoutes: ['/settings', '/saved', '/analysis-history'],
      priority: 'medium'
    },
    '/explore': {
      preloadRoutes: ['/reels', '/discovery', '/groups'],
      priority: 'medium'
    },
    '/tarot': {
      preloadRoutes: ['/coffee-fortune', '/palmistry', '/birth-chart', '/numerology'],
      priority: 'low'
    },
    '/friends': {
      preloadRoutes: ['/messages', '/match'],
      priority: 'medium'
    },
    '/groups': {
      preloadRoutes: ['/feed', '/messages'],
      priority: 'low'
    }
  };

  const preloadConfig = config || defaultConfig;

  /**
   * Preload a single route component
   */
  const preloadRoute = (path: string) => {
    const component = routeComponents[path];
    
    if (!component || preloadedRef.current.has(path)) {
      return;
    }

    if ('preload' in component && typeof component.preload === 'function') {
      console.log(`🚀 Preloading route: ${path}`);
      component.preload()
        .then(() => {
          preloadedRef.current.add(path);
          console.log(`✅ Route preloaded: ${path}`);
        })
        .catch((error: any) => {
          console.error(`❌ Failed to preload ${path}:`, error);
        });
    }
  };

  /**
   * Preload routes with priority scheduling
   */
  const preloadWithPriority = (routes: string[], priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') {
      // High priority: Preload immediately
      routes.forEach(route => preloadRoute(route));
    } else if (priority === 'medium') {
      // Medium priority: Preload after a short delay
      setTimeout(() => {
        routes.forEach(route => preloadRoute(route));
      }, 500);
    } else {
      // Low priority: Preload during idle time
      if ('requestIdleCallback' in window) {
        idleCallbackIdRef.current = window.requestIdleCallback(() => {
          routes.forEach(route => preloadRoute(route));
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          routes.forEach(route => preloadRoute(route));
        }, 2000);
      }
    }
  };

  /**
   * Preload based on current route
   */
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find matching config (exact match or starts with)
    let matchedConfig = preloadConfig[currentPath];
    
    if (!matchedConfig) {
      // Try to match profile paths like /profile/:username
      if (currentPath.startsWith('/profile/')) {
        matchedConfig = preloadConfig['/profile'];
      } else if (currentPath.startsWith('/groups/')) {
        matchedConfig = preloadConfig['/groups'];
      }
    }

    if (matchedConfig) {
      preloadWithPriority(matchedConfig.preloadRoutes, matchedConfig.priority);
    }

    // Cleanup
    return () => {
      if (idleCallbackIdRef.current) {
        window.cancelIdleCallback(idleCallbackIdRef.current);
      }
    };
  }, [location.pathname]);

  /**
   * Preload common routes during idle time (after initial load)
   */
  useEffect(() => {
    const commonRoutes = ['/feed', '/messages', '/profile', '/explore'];
    
    // Wait a bit after app load, then preload common routes
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          commonRoutes.forEach(route => preloadRoute(route));
        }, { timeout: 5000 });
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  return {
    preloadRoute,
    preloadedRoutes: preloadedRef.current
  };
}
