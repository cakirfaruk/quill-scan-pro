import { WifiOff, RefreshCw, Home, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/feed';
  };

  const handleViewCached = () => {
    window.location.href = '/cache-management';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 0.95, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <WifiOff className="w-12 h-12 text-muted-foreground" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Çevrimdışısınız
            </h1>
            <p className="text-muted-foreground">
              İnternet bağlantınız kesilmiş görünüyor. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium text-foreground">Deneyebileceğiniz şeyler:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Wi-Fi veya mobil veri bağlantınızı kontrol edin</li>
              <li>• Uçak modunun kapalı olduğundan emin olun</li>
              <li>• Sayfayı yenilemeyi deneyin</li>
              <li>• Önbelleğe alınmış içeriklere göz atın</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleGoHome} 
                variant="outline" 
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
              
              <Button 
                onClick={handleViewCached} 
                variant="outline" 
                className="flex-1"
              >
                <History className="w-4 h-4 mr-2" />
                Önbellek
              </Button>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-500"
              />
              <span>Bağlantı bekleniyor...</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Offline;
