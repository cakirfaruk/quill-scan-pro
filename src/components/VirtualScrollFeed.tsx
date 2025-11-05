import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollItem {
  id: string;
  height?: number;
}

interface VirtualScrollFeedProps<T extends VirtualScrollItem> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number; // Estimated height if not provided in item
  overscan?: number; // Number of items to render outside viewport
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loader?: React.ReactNode;
}

/**
 * Virtual scrolling component for large lists
 * Only renders items visible in viewport + overscan
 */
export function VirtualScrollFeed<T extends VirtualScrollItem>({
  items,
  renderItem,
  itemHeight = 200,
  overscan = 3,
  className,
  onLoadMore,
  hasMore = false,
  loader,
}: VirtualScrollFeedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate which items should be visible
  const getVisibleRange = useCallback(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const { start, end } = getVisibleRange();

  // Total height of all items
  const totalHeight = items.reduce(
    (acc, item) => acc + (item.height || itemHeight),
    0
  );

  // Offset from top for first visible item
  const offsetY = items
    .slice(0, start)
    .reduce((acc, item) => acc + (item.height || itemHeight), 0);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(newScrollTop);

    // Load more when near bottom
    if (hasMore && onLoadMore && scrollHeight - newScrollTop - clientHeight < 500) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Update container height
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: '100%', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(start, end).map((item, index) => (
            <div key={item.id} style={{ height: item.height || itemHeight }}>
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>

      {hasMore && loader && (
        <div className="py-4 flex justify-center">{loader}</div>
      )}
    </div>
  );
}
