import { forwardRef, useState, useId, type ComponentProps, type FocusEvent } from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends ComponentProps<"input"> {
  label: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, type, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const inputId = id || useId();

    return (
      <div className="relative">
        <input
          id={inputId}
          type={type}
          className={cn(
            "peer flex h-12 w-full rounded-md border border-input bg-background px-3 pt-5 pb-1 text-base transition-all duration-300",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "focus-visible:border-primary focus-visible:shadow-lg focus-visible:shadow-primary/20",
            "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm",
            className,
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 top-3 text-sm text-muted-foreground transition-all duration-300 pointer-events-none",
            "peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary peer-focus:font-medium",
            "peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium",
            (isFocused || hasValue || props.value) && "top-1 text-xs font-medium",
            isFocused && "text-primary"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
          "focus-visible:border-primary focus-visible:shadow-lg focus-visible:shadow-primary/20 focus-visible:scale-[1.01]",
          "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, FloatingInput };
