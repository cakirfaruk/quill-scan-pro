import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string;
}

const STORAGE_KEY_PREFIX = "onboarding-completed-";

export const OnboardingTour = ({
  steps,
  onComplete,
  onSkip,
  storageKey = "default",
}: OnboardingTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(STORAGE_KEY_PREFIX + storageKey);
    if (!completed) {
      // Small delay before showing to let the page render
      setTimeout(() => setIsOpen(true), 500);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen || !steps[currentStep]?.targetSelector) {
      setTargetPosition({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll target into view
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, "true");
    onSkip?.();
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY_PREFIX + storageKey, "true");
    onComplete?.();
  };

  const getTooltipPosition = () => {
    if (!steps[currentStep]?.targetSelector) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const position = steps[currentStep].position || "bottom";
    const padding = 20;

    switch (position) {
      case "top":
        return {
          top: `${targetPosition.top - padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${targetPosition.top + targetPosition.height + padding}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left - padding}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left + targetPosition.width + padding}px`,
          transform: "translate(0, -50%)",
        };
      case "center":
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with spotlight */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{
              background: `radial-gradient(
                circle ${Math.max(targetPosition.width, targetPosition.height) + 40}px at 
                ${targetPosition.left + targetPosition.width / 2}px 
                ${targetPosition.top + targetPosition.height / 2}px,
                rgba(0, 0, 0, 0.1),
                rgba(0, 0, 0, 0.85)
              )`,
              transition: "background 0.3s ease-out",
            }}
          />

          {/* Highlighted target border */}
          {currentStepData?.targetSelector && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: targetPosition.top - 8,
                left: targetPosition.left - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
                border: "3px solid hsl(var(--primary))",
                borderRadius: "12px",
                boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 40px hsl(var(--primary) / 0.3)",
                transition: "all 0.3s ease-out",
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed z-[10000] max-w-md"
            style={getTooltipPosition()}
          >
            <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-6 glass-card">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {currentStepData.icon && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {currentStepData.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Adım {currentStep + 1} / {steps.length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress */}
              <Progress value={progress} className="mb-4 h-1.5" />

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Optional Action */}
              {currentStepData.action && (
                <Button
                  onClick={currentStepData.action.onClick}
                  className="w-full mb-4"
                  variant="outline"
                >
                  {currentStepData.action.label}
                </Button>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Atla
                </Button>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Geri
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="gap-1"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check className="w-4 h-4" />
                        Tamamla
                      </>
                    ) : (
                      <>
                        İleri
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex gap-1.5 mt-4 justify-center">
                {steps.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === currentStep
                        ? "w-8 bg-primary"
                        : index < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    )}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper function to reset onboarding
export const resetOnboarding = (storageKey = "default") => {
  localStorage.removeItem(STORAGE_KEY_PREFIX + storageKey);
};
