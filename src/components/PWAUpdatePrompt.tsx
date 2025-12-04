import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, X, Sparkles } from "lucide-react";

export const PWAUpdatePrompt = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting SW to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Show again after 1 hour if user dismisses
    setTimeout(() => {
      if (waitingWorker) {
        setShowUpdate(true);
      }
    }, 60 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <Card className="p-4 bg-card/95 backdrop-blur-lg border-primary/20 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">
                  Yeni Güncelleme Mevcut!
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Stellara'nın yeni bir sürümü hazır. En iyi deneyim için güncellemenizi öneririz.
                </p>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    className="flex-1"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Güncelle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
