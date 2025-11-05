import { cn } from "@/lib/utils";

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: "pulse" | "shimmer" | "wave";
}

function EnhancedSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
  count = 1,
  animation = "shimmer",
  ...props
}: EnhancedSkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded";
      case "circular":
        return "rounded-full aspect-square";
      case "rounded":
        return "rounded-lg";
      case "rectangular":
      default:
        return "rounded-md";
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case "pulse":
        return "animate-pulse bg-muted";
      case "wave":
        return "animate-pulse-glow bg-muted";
      case "shimmer":
      default:
        return "bg-muted relative overflow-hidden";
    }
  };

  const skeletonStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        getVariantClasses(),
        getAnimationClasses(),
        className
      )}
      style={skeletonStyle}
      {...props}
    >
      {animation === "shimmer" && (
        <div className="absolute inset-0 shimmer-effect" />
      )}
    </div>
  ));

  return count > 1 ? <div className="space-y-2">{skeletons}</div> : skeletons[0];
}

// Pre-built skeleton components
const SkeletonCard = () => (
  <div className="p-6 space-y-4 border rounded-lg animate-fade-in bg-card">
    <div className="flex items-center gap-4">
      <EnhancedSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <EnhancedSkeleton variant="text" width="60%" />
        <EnhancedSkeleton variant="text" width="40%" />
      </div>
    </div>
    <EnhancedSkeleton variant="rectangular" height={120} />
    <div className="flex gap-2">
      <EnhancedSkeleton variant="rounded" width={80} height={32} />
      <EnhancedSkeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
);

const SkeletonPost = () => (
  <div className="p-6 space-y-4 border rounded-lg shadow-card animate-fade-in bg-card">
    <div className="flex items-center gap-3">
      <EnhancedSkeleton variant="circular" width={40} height={40} animation="shimmer" />
      <div className="flex-1 space-y-2">
        <EnhancedSkeleton variant="text" width="30%" animation="shimmer" />
        <EnhancedSkeleton variant="text" width="20%" animation="shimmer" />
      </div>
    </div>
    <EnhancedSkeleton variant="text" count={3} animation="shimmer" />
    <EnhancedSkeleton variant="rectangular" height={200} className="rounded-lg" animation="shimmer" />
    <div className="flex gap-4">
      <EnhancedSkeleton variant="rounded" width={60} height={28} animation="shimmer" />
      <EnhancedSkeleton variant="rounded" width={60} height={28} animation="shimmer" />
      <EnhancedSkeleton variant="rounded" width={60} height={28} animation="shimmer" />
    </div>
  </div>
);

const SkeletonProfile = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center gap-6">
      <EnhancedSkeleton variant="circular" width={120} height={120} />
      <div className="flex-1 space-y-3">
        <EnhancedSkeleton variant="text" width="40%" height={32} />
        <EnhancedSkeleton variant="text" width="60%" />
        <div className="flex gap-4">
          <EnhancedSkeleton variant="rounded" width={100} height={36} />
          <EnhancedSkeleton variant="rounded" width={100} height={36} />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <EnhancedSkeleton key={i} variant="rectangular" className="aspect-square rounded-lg" />
      ))}
    </div>
  </div>
);

const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
        <EnhancedSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton variant="text" width="70%" />
          <EnhancedSkeleton variant="text" width="50%" />
        </div>
        <EnhancedSkeleton variant="rounded" width={80} height={32} />
      </div>
    ))}
  </div>
);

const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3 animate-fade-in">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <EnhancedSkeleton key={i} variant="text" height={40} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIdx) => (
          <EnhancedSkeleton key={colIdx} variant="text" />
        ))}
      </div>
    ))}
  </div>
);

export {
  EnhancedSkeleton,
  SkeletonCard,
  SkeletonPost,
  SkeletonProfile,
  SkeletonList,
  SkeletonTable,
};
