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
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) => {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="max-w-md mx-auto space-y-6">
        {illustration ? (
          <div className="flex justify-center mb-6 animate-fade-in">
            {illustration}
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-scale-in">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        )}
        
        <div className="space-y-2 animate-fade-in">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            size="lg"
            className="gap-2 mt-6 animate-fade-in hover-scale"
          >
            <Icon className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
