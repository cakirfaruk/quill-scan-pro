import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface MissionCompletedModalProps {
  mission: {
    title: string;
    icon: string;
    credit_reward: number;
    xp_reward: number;
  } | null;
  onClose: () => void;
}

export function MissionCompletedModal({ mission, onClose }: MissionCompletedModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (mission) {
      setOpen(true);
      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [mission]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-4xl">
                  {mission.icon}
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-2 -right-2"
                >
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
            Görev Tamamlandı! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h3 className="font-bold text-lg mb-2">{mission.title}</h3>
            <p className="text-sm text-muted-foreground">
              Harika! Bu görevi başarıyla tamamladınız.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-4 text-center border border-yellow-500/20">
              <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{mission.credit_reward}</div>
              <div className="text-xs text-muted-foreground">Kredi</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 text-center border border-blue-500/20">
              <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{mission.xp_reward}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleClose}
              className="w-full"
              size="lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Harika!
            </Button>
          </motion.div>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Diğer görevlere devam edin ve daha fazla ödül kazanın!
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
