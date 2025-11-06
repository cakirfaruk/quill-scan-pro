import { lazy, ComponentType } from 'react';

/**
 * Lazy load heavy libraries to reduce initial bundle size
 * These should only be loaded when actually needed
 * 
 * TREE-SHAKING OPTIMIZATION:
 * - Only import what you need from libraries
 * - Use named imports instead of namespace imports
 * - Avoid `import *` when possible
 */

// Framer Motion - heavy animation library (~165KB)
// Use specific imports for better tree-shaking
export const lazyMotion = () => import('framer-motion');

// Emoji Picker - large component with many assets (~100KB)
export const lazyEmojiPicker = () => import('emoji-picker-react');

// Charts - only needed on specific pages (~150KB)
export const lazyRecharts = () => import('recharts');

// Fabric.js - canvas library (~150KB) - only for story editor
export const lazyFabric = () => import('fabric');

// Date utilities - OPTIMIZED for tree-shaking
// Import only what you need - each function is ~1-2KB
export { 
  format, 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  parseISO,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  differenceInDays
} from 'date-fns';

// Pre-export commonly used lazy components
export const LazyEmojiPicker = lazy(() => 
  lazyEmojiPicker().then(mod => ({ default: mod.default }))
);

/**
 * Create a lazy loaded component with preload capability
 * Usage:
 * const MyComponent = createLazyComponent(() => import('./MyComponent'));
 * MyComponent.preload(); // Preload before render
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  // Add preload method
  (LazyComponent as any).preload = importFn;
  return LazyComponent;
}

/**
 * IMPORTANT: Avoid these patterns for better bundle size:
 * 
 * ❌ BAD:
 * import * as React from 'react';
 * import * as dateFns from 'date-fns';
 * import * as lucideIcons from 'lucide-react';
 * 
 * ✅ GOOD:
 * import { useState, useEffect } from 'react';
 * import { format, parseISO } from 'date-fns';
 * import { Heart, MessageCircle } from 'lucide-react';
 */
