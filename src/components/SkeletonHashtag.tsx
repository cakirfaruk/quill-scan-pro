import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

export const SkeletonHashtag = () => (
  <div className="w-full p-4 rounded-lg border animate-fade-in">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <EnhancedSkeleton variant="text" width={40} height={32} />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton variant="text" width="50%" />
          <EnhancedSkeleton variant="text" width="30%" />
        </div>
      </div>
      <EnhancedSkeleton variant="circular" width={20} height={20} />
    </div>
  </div>
);

export const SkeletonHashtagList = ({ count = 10 }: { count?: number }) => (
  <div className="space-y-3 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonHashtag key={i} />
    ))}
  </div>
);

export const SkeletonSearchResult = () => (
  <div className="p-4 border rounded-lg animate-fade-in">
    <div className="flex items-start gap-3">
      <EnhancedSkeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <EnhancedSkeleton variant="text" width="30%" />
          <EnhancedSkeleton variant="text" width="20%" />
        </div>
        <EnhancedSkeleton variant="text" count={3} />
        <EnhancedSkeleton variant="rectangular" height={160} className="rounded-lg mt-3" />
      </div>
    </div>
  </div>
);
