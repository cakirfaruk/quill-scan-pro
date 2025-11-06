import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ 
  className, 
  shimmer = true,
  ...props 
}: HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div 
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        shimmer && "animate-pulse",
        className
      )} 
      {...props}
    >
      {shimmer && (
        <div className="absolute inset-0 shimmer-effect" />
      )}
    </div>
  );
}

export { Skeleton };
