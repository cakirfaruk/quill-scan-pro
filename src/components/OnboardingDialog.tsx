import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Users, Heart, MessageCircle, Sparkles } from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    title: "Hoş Geldiniz! 🎉",
    description: "Kişisel Analiz Merkezi'ne hoş geldiniz. Size platformu tanıtmak istiyoruz.",
    icon: <Sparkles className="w-12 h-12 text-primary" />,
  },
  {
    title: "AI Destekli Analizler",
    description: "El yazısı, numeroloji, doğum haritası ve daha fazlası! Yapay zeka ile kişisel analizlerinizi hemen alabilirsiniz.",
    icon: <FileText className="w-12 h-12 text-primary" />,
  },
  {
    title: "Sosyal Özellikler",
    description: "Arkadaş edinin, analiz sonuçlarınızı paylaşın, hikayeler ekleyin ve eşleşme sistemimizle yeni insanlarla tanışın!",
    icon: <Users className="w-12 h-12 text-primary" />,
  },
  {
    title: "Mesajlaşma & İletişim",
    description: "Arkadaşlarınızla mesajlaşın, sesli mesaj gönderin, GIF paylaşın ve daha fazlası!",
    icon: <MessageCircle className="w-12 h-12 text-primary" />,
  },
  {
    title: "Hazırsınız! 🚀",
    description: "Artık platformu keşfetmeye başlayabilirsiniz. İlk hediye kredileriniz hesabınıza tanımlandı!",
    icon: <Heart className="w-12 h-12 text-primary" />,
  },
];

export const OnboardingDialog = ({ open, onComplete }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base pt-2 sm:pt-4">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4 sm:py-8">
          {steps[currentStep].icon}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <span>Adım {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2 mt-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 text-xs sm:text-sm"
              size="sm"
            >
              Geri
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 text-xs sm:text-sm"
                size="sm"
              >
                Atla
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 text-xs sm:text-sm"
                size="sm"
              >
                İleri
              </Button>
            </>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 text-xs sm:text-sm"
              size="sm"
            >
              Başlayalım!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
