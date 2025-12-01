import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("stellara_cookie_consent");
    if (!consent) {
      // Show banner after 1 second delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("stellara_cookie_consent", "accepted");
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("stellara_cookie_consent", "rejected");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <Card className="p-6 shadow-2xl border-2 backdrop-blur-xl bg-background/95">
            <button
              onClick={handleReject}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">🍪 Çerez Kullanımı</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stellara, deneyiminizi iyileştirmek ve hizmetlerimizi geliştirmek için çerezler kullanır. 
                  Devam ederek çerez kullanımını kabul etmiş olursunuz.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={handleAccept}
                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                  >
                    Kabul Et
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1"
                  >
                    Reddet
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Daha fazla bilgi için{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:underline"
                    onClick={() => setShowBanner(false)}
                  >
                    Gizlilik Politikamızı
                  </a>{" "}
                  inceleyebilirsiniz.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
