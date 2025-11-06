import { lazy, ComponentType } from 'react';

/**
 * Lazy load heavy libraries to reduce initial bundle size
 * These should only be loaded when actually needed
 */

// Framer Motion - heavy animation library (~165KB)
export const lazyMotion = () => import('framer-motion');

// Emoji Picker - large component with many assets (~100KB)
export const lazyEmojiPicker = () => import('emoji-picker-react');

// Charts - only needed on specific pages (~150KB)
export const lazyRecharts = () => import('recharts');

// Date utilities - tree-shake by importing specific functions
export { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

// Pre-export commonly used lazy components
export const LazyEmojiPicker = lazy(() => 
  lazyEmojiPicker().then(mod => ({ default: mod.default }))
);

/**
 * Create a lazy loaded component with preload capability
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  // Add preload method
  (LazyComponent as any).preload = importFn;
  return LazyComponent;
}
