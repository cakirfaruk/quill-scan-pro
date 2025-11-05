import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading with preload capability
 * Allows components to be preloaded on hover or other triggers
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;

  const loadComponent = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
    return factoryPromise;
  };

  // Add preload method to component
  (LazyComponent as any).preload = loadComponent;

  return LazyComponent as typeof LazyComponent & { preload: () => Promise<{ default: T }> };
}

/**
 * Preload multiple components at once
 */
export function preloadComponents(...components: Array<any>) {
  return Promise.all(
    components.map(component => 
      component.preload ? component.preload() : Promise.resolve()
    )
  );
}

/**
 * Preload on route hover - use with Link components
 */
export function createPreloadHandler(component: any) {
  return () => {
    if (component.preload) {
      component.preload();
    }
  };
}
