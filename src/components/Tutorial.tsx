import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    target: ".header-logo",
    title: "Hoş Geldiniz!",
    description: "Bu hızlı tur ile uygulamanın özelliklerini keşfedelim",
    position: "bottom"
  },
  {
    target: "[href='/']",
    title: "Ana Sayfa",
    description: "Buradan tüm analiz ve fallarınızı başlatabilirsiniz",
    position: "bottom"
  },
  {
    target: "[href='/feed']",
    title: "Akış",
    description: "Arkadaşlarınızın paylaşımlarını görün ve etkileşime geçin",
    position: "bottom"
  },
  {
    target: "[href='/messages']",
    title: "Mesajlar",
    description: "Arkadaşlarınızla sohbet edin, sesli mesaj gönderin",
    position: "bottom"
  },
  {
    target: "[href='/match']",
    title: "Eşleşme",
    description: "Burç uyumuna göre yeni insanlarla tanışın",
    position: "bottom"
  },
  {
    target: ".notification-bell",
    title: "Bildirimler",
    description: "Yeni mesajlar, beğeniler ve arkadaşlık isteklerini buradan takip edin",
    position: "left"
  },
  {
    target: ".user-avatar",
    title: "Profil",
    description: "Profilinizi düzenleyin, analizlerinizi görüntüleyin",
    position: "left"
  }
];

export const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if tutorial should be shown
    const tutorialCompleted = localStorage.getItem("tutorial_completed");
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    
    if (!tutorialCompleted && onboardingCompleted) {
      // Show tutorial after a short delay
      setTimeout(() => {
        setIsActive(true);
        updatePosition();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isActive, currentStep]);

  const updatePosition = () => {
    const step = tutorialSteps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (step.position) {
        case "bottom":
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case "top":
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setPosition({ top, left });

      // Highlight the target element
      element.classList.add("tutorial-highlight");
      
      // Remove highlight from previous elements
      document.querySelectorAll(".tutorial-highlight").forEach((el) => {
        if (el !== element) {
          el.classList.remove("tutorial-highlight");
        }
      });
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem("tutorial_completed", "true");
    setIsActive(false);
    
    // Remove all highlights
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
  };

  if (!isActive) return null;

  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Tutorial Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: step.position === "left" || step.position === "right"
              ? "translate(-50%, -50%)"
              : "translate(-50%, 0)"
          }}
        >
          <Card className="p-4 max-w-xs shadow-2xl border-2 border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">{step.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {tutorialSteps.length}
              </span>
              
              <Button size="sm" onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? (
                  "Tamamla"
                ) : (
                  <>
                    İleri
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Arrow pointer */}
          <div
            className={`absolute w-0 h-0 ${
              step.position === "bottom"
                ? "border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-background -top-2 left-1/2 -translate-x-1/2"
                : step.position === "top"
                ? "border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-background -bottom-2 left-1/2 -translate-x-1/2"
                : step.position === "left"
                ? "border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-background -right-2 top-1/2 -translate-y-1/2"
                : "border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-background -left-2 top-1/2 -translate-y-1/2"
            }`}
          />
        </motion.div>
      </AnimatePresence>

      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 9999 !important;
          box-shadow: 0 0 0 4px rgba(var(--primary), 0.5), 0 0 20px rgba(var(--primary), 0.3) !important;
          border-radius: 8px;
          animation: tutorial-pulse 2s infinite;
        }

        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(var(--primary), 0.5), 0 0 20px rgba(var(--primary), 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(var(--primary), 0.3), 0 0 30px rgba(var(--primary), 0.5);
          }
        }
      `}</style>
    </>
  );
};
