import { Card } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

export const SkeletonGroup = () => (
  <Card className="p-6 animate-fade-in">
    <div className="flex items-start gap-4">
      <EnhancedSkeleton variant="circular" width={64} height={64} />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <EnhancedSkeleton variant="text" width="40%" height={24} />
          <EnhancedSkeleton variant="rounded" width={60} height={20} />
        </div>
        <EnhancedSkeleton variant="text" width="80%" />
        <div className="flex items-center gap-4">
          <EnhancedSkeleton variant="text" width={80} />
          <EnhancedSkeleton variant="text" width={100} />
          <EnhancedSkeleton variant="text" width={60} />
        </div>
      </div>
    </div>
  </Card>
);

export const SkeletonGroupList = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonGroup key={i} />
    ))}
  </div>
);
