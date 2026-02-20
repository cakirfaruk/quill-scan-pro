import { lazy, ComponentType } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

/**
 * Wraps a dynamic import factory with automatic retry logic.
 *
 * On chunk-load failure (e.g. 404 from stale CDN cache after a deploy),
 * it retries up to MAX_RETRIES times with exponential back-off before
 * giving up and letting the error bubble to ChunkErrorBoundary.
 *
 * @param factory  - `() => import('./MyComponent')`
 * @param retries  - max retry attempts (default 3)
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number = MAX_RETRIES
) {
  return lazy(() => importWithRetry(factory, retries));
}

async function importWithRetry<T>(
  factory: () => Promise<T>,
  retriesLeft: number,
  attempt = 0
): Promise<T> {
  try {
    return await factory();
  } catch (err) {
    if (retriesLeft === 0) throw err;

    // Only retry on chunk-load / network errors, not syntax/runtime errors
    if (!isRetryableError(err)) throw err;

    const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // 800ms, 1600ms, 3200ms
    await sleep(delay);

    if (import.meta.env.DEV) {
      console.warn(
        `[lazyWithRetry] Retrying dynamic import (attempt ${attempt + 1})…`,
        err
      );
    }

    return importWithRetry(factory, retriesLeft - 1, attempt + 1);
  }
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? '';
  const name = err.name ?? '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    name.includes('ChunkLoadError') ||
    // Network errors
    msg.includes('NetworkError') ||
    msg.includes('Failed to fetch')
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Same as lazyWithRetry but also exposes a `.preload()` method for
 * hover-based prefetching on nav links.
 */
export function lazyWithRetryAndPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number = MAX_RETRIES
) {
  const LazyComponent = lazyWithRetry(factory, retries);
  let cachedPromise: Promise<{ default: T }> | undefined;

  const preload = () => {
    if (!cachedPromise) {
      cachedPromise = importWithRetry(factory, retries);
    }
    return cachedPromise;
  };

  (LazyComponent as any).preload = preload;
  return LazyComponent as typeof LazyComponent & {
    preload: () => Promise<{ default: T }>;
  };
}
