import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SkeletonProfile = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Profile Header Skeleton */}
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Avatar */}
        <Skeleton className="w-32 h-32 rounded-full" />
        
        {/* Name & Username */}
        <div className="space-y-2 text-center w-full">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        
        {/* Stats */}
        <div className="flex gap-8 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </Card>

    {/* Tabs Skeleton */}
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full justify-start">
        {['Gönderiler', 'Analizler', 'Fotoğraflar'].map((tab) => (
          <TabsTrigger key={tab} value={tab.toLowerCase()} disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    {/* Content Skeleton */}
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
