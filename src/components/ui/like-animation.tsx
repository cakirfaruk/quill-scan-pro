import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

interface LikeAnimationProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: number;
  particleCount?: number;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  color: string;
}

export const LikeAnimation = ({ 
  isLiked, 
  onToggle, 
  size = 24,
  particleCount = 12 
}: LikeAnimationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleClick = () => {
    if (!isLiked) {
      // Generate particles
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        angle: (360 / particleCount) * i,
        distance: 40 + Math.random() * 20,
        color: ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--accent))'][Math.floor(Math.random() * 3)]
      }));
      setParticles(newParticles);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 1000);
    }
    onToggle();
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative z-10 focus:outline-none"
      >
        <motion.div
          animate={isLiked ? {
            scale: [1, 1.2, 1],
            rotate: [0, -10, 10, -10, 0]
          } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Heart
            size={size}
            className={isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"}
          />
        </motion.div>
      </motion.button>

      {/* Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0,
              scale: 0,
              x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
              y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: particle.color,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Ring effect */}
      <AnimatePresence>
        {isLiked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-destructive pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
