import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface OracleCrystalBallProps {
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

export const OracleCrystalBall = ({ animate = false, size = "lg" }: OracleCrystalBallProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className="relative">
      {/* Glow effect */}
      <motion.div
        animate={animate ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        } : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-30 ${sizeClasses[size]}`}
      />
      
      {/* Main crystal ball */}
      <motion.div
        animate={animate ? {
          rotate: [0, 5, -5, 0],
          y: [0, -5, 0],
        } : undefined}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden`}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Stars inside */}
        <motion.div
          animate={animate ? {
            rotate: -360,
          } : undefined}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={animate ? {
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              } : undefined}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${30 + Math.random() * 40}%`,
                left: `${30 + Math.random() * 40}%`,
              }}
            />
          ))}
        </motion.div>
        
        {/* Center icon */}
        <motion.div
          animate={animate ? {
            scale: [1, 1.1, 1],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Sparkles className={`${size === "lg" ? "w-12 h-12" : size === "md" ? "w-8 h-8" : "w-5 h-5"} text-white/90`} />
        </motion.div>
        
        {/* Shine effect */}
        <div className="absolute top-2 left-4 w-4 h-4 bg-white/40 rounded-full blur-sm" />
      </motion.div>
      
      {/* Floating particles */}
      {animate && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-10, -30, -10],
                x: [0, (i - 1) * 15, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full"
            />
          ))}
        </>
      )}
    </div>
  );
};
