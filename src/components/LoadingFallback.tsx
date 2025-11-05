import { memo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingFallbackProps {
  className?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export const LoadingFallback = memo(({ 
  className, 
  fullScreen = true, 
  size = "md" 
}: LoadingFallbackProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4",
      fullScreen && "min-h-screen bg-background",
      !fullScreen && "py-8",
      className
    )}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <p className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</p>
    </div>
  );
});

LoadingFallback.displayName = "LoadingFallback";
