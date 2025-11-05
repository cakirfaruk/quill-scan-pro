import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

export const SkeletonConversation = () => (
  <div className="flex items-center gap-3 p-4 border-b animate-fade-in">
    <EnhancedSkeleton variant="circular" width={48} height={48} />
    <div className="flex-1 space-y-2">
      <EnhancedSkeleton variant="text" width="40%" />
      <EnhancedSkeleton variant="text" width="60%" />
    </div>
    <EnhancedSkeleton variant="circular" width={20} height={20} />
  </div>
);

export const SkeletonMessage = () => (
  <div className="flex gap-2 mb-4 animate-fade-in">
    <EnhancedSkeleton variant="circular" width={32} height={32} />
    <div className="flex-1 space-y-2">
      <EnhancedSkeleton variant="text" width="30%" />
      <EnhancedSkeleton variant="rounded" width="70%" height={60} />
    </div>
  </div>
);

export const SkeletonConversationList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-0 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonConversation key={i} />
    ))}
  </div>
);

export const SkeletonMessageList = ({ count = 8 }: { count?: number }) => (
  <div className="space-y-4 p-4 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonMessage key={i} />
    ))}
  </div>
);
