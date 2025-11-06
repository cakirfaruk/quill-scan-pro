import { memo, forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";

/**
 * Optimized Button component with memo
 * Use this for buttons that receive stable props
 */
export const OptimizedButton = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (props, ref) => {
      return <Button ref={ref} {...props} />;
    }
  )
);

OptimizedButton.displayName = "OptimizedButton";
