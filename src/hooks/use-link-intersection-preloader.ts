import { useEffect, useRef } from 'react';

/**
 * Automatically preload route components when links enter viewport
 * Uses Intersection Observer for efficient link detection
 */
export function useLinkIntersectionPreloader(routeComponents: { [path: string]: any }) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const preloadedLinksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            
            if (href && !preloadedLinksRef.current.has(href)) {
              // Match href to route component
              const component = routeComponents[href];
              
              if (component && 'preload' in component) {
                console.log(`👁️ Link visible, preloading: ${href}`);
                component.preload()
                  .then(() => {
                    preloadedLinksRef.current.add(href);
                    console.log(`✅ Link preloaded: ${href}`);
                  })
                  .catch((error: any) => {
                    console.error(`❌ Failed to preload ${href}:`, error);
                  });
              }
              
              // Stop observing once preloaded
              observerRef.current?.unobserve(link);
            }
          }
        });
      },
      {
        // Start preloading when link is 200px away from viewport
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    // Observe all internal navigation links
    const observeLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach((link) => {
        if (link instanceof HTMLAnchorElement) {
          observerRef.current?.observe(link);
        }
      });
    };

    // Initial observation
    observeLinks();

    // Re-observe links when DOM changes (for dynamically added links)
    const mutationObserver = new MutationObserver(() => {
      observeLinks();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
    };
  }, [routeComponents]);

  return {
    preloadedLinks: preloadedLinksRef.current
  };
}
