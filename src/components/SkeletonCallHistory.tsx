import { Card } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

export const SkeletonCallLog = () => (
  <div className="p-4 border-b last:border-b-0 animate-fade-in">
    <div className="flex items-center gap-4">
      <EnhancedSkeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <EnhancedSkeleton variant="circular" width={20} height={20} />
          <EnhancedSkeleton variant="text" width="40%" />
        </div>
        <EnhancedSkeleton variant="text" width="60%" />
      </div>
      <div className="text-right space-y-2">
        <EnhancedSkeleton variant="text" width={60} />
        <EnhancedSkeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  </div>
);

export const SkeletonCallHistoryGroup = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-6 animate-fade-in">
    {Array.from({ length: 2 }).map((_, groupIdx) => (
      <div key={groupIdx}>
        <EnhancedSkeleton variant="text" width={100} height={20} className="mb-3" />
        <Card className="divide-y">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCallLog key={i} />
          ))}
        </Card>
      </div>
    ))}
  </div>
);
