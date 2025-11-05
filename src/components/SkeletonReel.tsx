import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";

export const SkeletonReel = () => (
  <div className="h-full w-full bg-black relative animate-fade-in">
    {/* Video skeleton */}
    <EnhancedSkeleton 
      variant="rectangular" 
      className="absolute inset-0 bg-gray-800" 
    />
    
    {/* Bottom overlay skeleton */}
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <EnhancedSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton variant="text" width="40%" className="bg-white/20" />
          <EnhancedSkeleton variant="text" width="60%" className="bg-white/20" />
        </div>
      </div>
      <EnhancedSkeleton variant="text" count={2} className="bg-white/20" />
    </div>

    {/* Right side action buttons */}
    <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
      <EnhancedSkeleton variant="circular" width={48} height={48} className="bg-white/20" />
      <EnhancedSkeleton variant="circular" width={48} height={48} className="bg-white/20" />
      <EnhancedSkeleton variant="circular" width={48} height={48} className="bg-white/20" />
    </div>
  </div>
);
