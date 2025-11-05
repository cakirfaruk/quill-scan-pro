import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
  variant?: "default" | "gradient";
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  variant = "default",
}: EmptyStateProps) => {
  return (
    <Card className={`p-12 text-center border-dashed ${variant === "gradient" ? "bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" : ""}`}>
      <div className="max-w-md mx-auto space-y-6">
        {illustration ? (
          <div className="flex justify-center mb-6 animate-fade-in">
            {illustration}
          </div>
        ) : (
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
            {/* Animated background rings */}
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-[ping_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-[ping_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
            
            {/* Icon container */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-[float_3s_ease-in-out_infinite]">
              <Icon className="w-10 h-10 text-primary animate-[wiggle_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}
        
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-semibold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            size="lg"
            className="gap-2 mt-6 animate-fade-in hover-scale shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ animationDelay: '0.4s' }}
          >
            <Icon className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
