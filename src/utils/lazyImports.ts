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
 * LAZY LOADED HEAVY MODALS - Only load when needed
 * These components are large and should be code-split
 */

// Dialog & Modal Components (~50KB total)
export const LazyCreatePostDialog = createLazyComponent(() => 
  import('@/components/CreatePostDialog').then(mod => ({ default: mod.CreatePostDialog }))
);

export const LazyStoryViewer = createLazyComponent(() => 
  import('@/components/StoryViewer').then(mod => ({ default: mod.StoryViewer }))
);

export const LazyCreateStoryDialog = createLazyComponent(() => 
  import('@/components/CreateStoryDialog').then(mod => ({ default: mod.CreateStoryDialog }))
);

export const LazyVideoCallDialog = createLazyComponent(() => 
  import('@/components/VideoCallDialog').then(mod => ({ default: mod.VideoCallDialog }))
);

export const LazyGroupVideoCallDialog = createLazyComponent(() => 
  import('@/components/GroupVideoCallDialog').then(mod => ({ default: mod.GroupVideoCallDialog }))
);

export const LazyFullScreenMediaViewer = createLazyComponent(() => 
  import('@/components/FullScreenMediaViewer').then(mod => ({ default: mod.FullScreenMediaViewer }))
);

export const LazyScheduleMessageDialog = createLazyComponent(() => 
  import('@/components/ScheduleMessageDialog').then(mod => ({ default: mod.ScheduleMessageDialog }))
);

export const LazyForwardMessageDialog = createLazyComponent(() => 
  import('@/components/ForwardMessageDialog').then(mod => ({ default: mod.ForwardMessageDialog }))
);

export const LazyCreateGroupFileDialog = createLazyComponent(() => 
  import('@/components/CreateGroupFileDialog').then(mod => ({ default: mod.CreateGroupFileDialog }))
);

export const LazyPhotoEditor = createLazyComponent(() => 
  import('@/components/PhotoCaptureEditor').then(mod => ({ default: mod.PhotoCaptureEditor }))
);

export const LazyStoryCanvas = createLazyComponent(() => 
  import('@/components/StoryCanvas').then(mod => ({ default: mod.StoryCanvas }))
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
