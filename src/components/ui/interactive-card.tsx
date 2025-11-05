import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pressEffect?: boolean;
  hoverGlow?: boolean;
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ className, pressEffect = true, hoverGlow = true, onClick, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-300 cursor-pointer",
          {
            "hover:scale-[1.02] active:scale-[0.98]": pressEffect,
            "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30": hoverGlow,
          },
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

InteractiveCard.displayName = "InteractiveCard";

export { InteractiveCard };
