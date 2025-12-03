import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const OracleTypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Animated crystal ball */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity },
            }}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-80"
          />
          
          {/* Typing dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-2 h-2 rounded-full bg-purple-400"
              />
            ))}
          </div>
          
          <span className="text-xs text-muted-foreground ml-2">
            Oracle düşünüyor...
          </span>
        </div>
      </div>
    </motion.div>
  );
};
