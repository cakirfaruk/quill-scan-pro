import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: React.ReactNode;
  variant?: "default" | "gradient" | "glass";
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  variant = "default",
}: EmptyStateProps) => {
  const getCardClassName = () => {
    const base = "p-12 text-center border-dashed";
    if (variant === "gradient") return `${base} bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5`;
    if (variant === "glass") return `${base} glass-card`;
    return base;
  };

  return (
    <div className="animate-fade-in">
      <Card className={getCardClassName()}>
        <div className="max-w-md mx-auto space-y-6">
          {illustration ? (
            <div className="flex justify-center mb-6 animate-bounce">
              {illustration}
            </div>
          ) : (
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              {/* Animated background rings */}
              <div
                className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-50"
              />
              <div
                className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-30 [animation-delay:1s]"
              />
              
              {/* Icon container */}
              <div
                className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 depth-1 animate-bounce"
              >
                <div>
                  <Icon className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          </div>

          {(actionLabel || secondaryActionLabel) && (
            <div className="flex gap-3 justify-center mt-6 animate-fade-in">
              {actionLabel && onAction && (
                <Button 
                  onClick={onAction} 
                  size="lg"
                  className="gap-2 hover-lift depth-2 hover:depth-3 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                  {actionLabel}
                </Button>
              )}
              {secondaryActionLabel && onSecondaryAction && (
                <Button 
                  onClick={onSecondaryAction} 
                  size="lg"
                  variant="outline"
                  className="gap-2 hover-lift transition-all duration-300"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
