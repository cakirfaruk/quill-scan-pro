import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className={getCardClassName()}>
        <div className="max-w-md mx-auto space-y-6">
          {illustration ? (
            <motion.div 
              className="flex justify-center mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {illustration}
            </motion.div>
          ) : (
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              {/* Animated background rings */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-primary/5"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              
              {/* Icon container */}
              <motion.div 
                className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 depth-1"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  animate={{ rotate: [-3, 3, -3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon className="w-10 h-10 text-primary" />
                </motion.div>
              </motion.div>
            </div>
          )}
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          </motion.div>

          {(actionLabel || secondaryActionLabel) && (
            <motion.div 
              className="flex gap-3 justify-center mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
