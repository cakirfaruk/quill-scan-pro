import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional human-readable name for the chunk (e.g. "Create Post") */
  chunkName?: string;
  /** Fallback to show while the chunk is being retried */
  loadingFallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isReloading: boolean;
  error: Error | null;
  retryCount: number;
}

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'Loading chunk',
  'Loading CSS chunk',
  'ChunkLoadError',
];

function isChunkLoadError(error: Error): boolean {
  return CHUNK_ERROR_PATTERNS.some(
    (pattern) =>
      error.message?.includes(pattern) ||
      error.name?.includes('ChunkLoadError') ||
      error.stack?.includes(pattern)
  );
}

/**
 * ChunkErrorBoundary
 *
 * Catches dynamic import (lazy chunk) failures — typically caused by stale
 * CDN/browser cache after a new deploy — and offers the user a one-click
 * hard-reload that busts the cache.
 *
 * Non-chunk errors are re-thrown so the parent ErrorBoundary can handle them.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      isReloading: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunk = isChunkLoadError(error);
    return {
      hasError: true,
      isChunkError: isChunk,
      error,
    };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    // If it's NOT a chunk error, bubble it up to the parent ErrorBoundary
    // by rethrowing — we only handle chunk errors here.
    if (!isChunkLoadError(error)) {
      throw error;
    }

    if (import.meta.env.DEV) {
      console.warn('[ChunkErrorBoundary] Caught stale chunk error:', error.message);
    }
  }

  /** Hard-reload with cache-busting query param so the browser fetches fresh chunks. */
  handleReload = () => {
    this.setState({ isReloading: true });

    // Mark in sessionStorage so we don't loop if the reload itself fails
    const reloadCount = parseInt(sessionStorage.getItem('chunkReloadCount') || '0', 10);
    if (reloadCount >= 2) {
      // Give up after 2 auto-reloads — just navigate home
      sessionStorage.removeItem('chunkReloadCount');
      window.location.href = '/';
      return;
    }
    sessionStorage.setItem('chunkReloadCount', String(reloadCount + 1));

    // Cache-busting: append a timestamp so the browser fetches fresh HTML/JS
    const url = new URL(window.location.href);
    url.searchParams.set('_cbust', String(Date.now()));
    window.location.replace(url.toString());
  };

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      isChunkError: false,
      isReloading: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  componentDidMount() {
    // Clear the reload counter once the app boots successfully
    sessionStorage.removeItem('chunkReloadCount');
  }

  render() {
    const { hasError, isChunkError, isReloading } = this.state;
    const { chunkName = 'bu bileşeni', loadingFallback } = this.props;

    if (!hasError) return this.props.children;

    // Non-chunk errors: don't render anything — we rethrew in componentDidCatch
    // so the parent boundary handles it. But getDerivedStateFromError already
    // set hasError, so render nothing here and let the parent boundary take over.
    if (!isChunkError) return null;

    if (isReloading && loadingFallback) return loadingFallback;

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[200px]">
        <div className="rounded-full bg-warning/10 p-4">
          <WifiOff className="h-8 w-8 text-warning" />
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground">Güncelleme algılandı</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Yeni bir sürüm yayınlandı. {chunkName} yüklenemiyor.
            Sayfayı yenileyerek devam edebilirsiniz.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={this.handleReload}
            disabled={isReloading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Yenileniyor…' : 'Sayfayı Yenile'}
          </Button>
          <Button size="sm" variant="ghost" onClick={this.handleReset}>
            Yine de Dene
          </Button>
        </div>
      </div>
    );
  }
}

/**
 * Inline chunk-error aware Suspense wrapper.
 * Usage:
 *   <WithChunkErrorBoundary chunkName="Gönderi Oluştur">
 *     <Suspense fallback={<Spinner />}>
 *       <LazyComponent />
 *     </Suspense>
 *   </WithChunkErrorBoundary>
 */
export function WithChunkErrorBoundary({
  children,
  chunkName,
}: {
  children: ReactNode;
  chunkName?: string;
}) {
  return (
    <ChunkErrorBoundary chunkName={chunkName}>
      {children}
    </ChunkErrorBoundary>
  );
}
