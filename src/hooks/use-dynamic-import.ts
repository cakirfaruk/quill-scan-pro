import { useState, useEffect } from 'react';

/**
 * Hook for dynamically importing heavy dependencies
 * Only loads the module when needed
 */
export function useDynamicImport<T>(
  importFn: () => Promise<T>,
  shouldLoad: boolean = true
) {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    const loadModule = async () => {
      setLoading(true);
      try {
        const loadedModule = await importFn();
        if (!cancelled) {
          setModule(loadedModule);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadModule();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad]);

  return { module, loading, error };
}

/**
 * Example usage:
 * 
 * // Only load heavy chart library when needed
 * const { module: Chart } = useDynamicImport(
 *   () => import('heavy-chart-library'),
 *   showChart // only load when chart needs to be shown
 * );
 */
