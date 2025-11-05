import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "inline-flex items-center justify-center rounded border font-mono text-xs font-semibold transition-colors",
  {
    variants: {
      size: {
        default: "h-6 min-w-6 px-1.5",
        sm: "h-5 min-w-5 px-1 text-[10px]",
        lg: "h-7 min-w-7 px-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <kbd
        className={cn(
          kbdVariants({ size }),
          "bg-muted border-border shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd, kbdVariants };
