import { motion } from "framer-motion";
import { Heart, Sparkles, MessageCircle, Trophy } from "lucide-react";

const notifications = [
  {
    icon: Heart,
    text: "Yeni eşleşme!",
    color: "from-pink-500 to-rose-500",
    delay: 0,
    position: { top: "15%", right: "-20%" },
  },
  {
    icon: Sparkles,
    text: "Tarot falın hazır!",
    color: "from-purple-500 to-violet-500",
    delay: 1,
    position: { top: "35%", left: "-25%" },
  },
  {
    icon: MessageCircle,
    text: "3 yeni mesaj!",
    color: "from-blue-500 to-cyan-500",
    delay: 2,
    position: { bottom: "30%", right: "-22%" },
  },
  {
    icon: Trophy,
    text: "Rozet kazandın!",
    color: "from-amber-500 to-yellow-500",
    delay: 3,
    position: { bottom: "15%", left: "-23%" },
  },
];

export const FloatingNotifications = () => {
  return (
    <>
      {notifications.map((notif, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.8],
            y: [0, -10, -10, 0],
          }}
          transition={{
            duration: 4,
            delay: notif.delay,
            repeat: Infinity,
            repeatDelay: 8,
            ease: "easeInOut",
          }}
          className="absolute z-20 pointer-events-none"
          style={notif.position}
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${notif.color} text-white shadow-lg backdrop-blur-sm`}
          >
            <notif.icon className="w-4 h-4" />
            <span className="text-sm font-semibold whitespace-nowrap">
              {notif.text}
            </span>
          </div>
        </motion.div>
      ))}
    </>
  );
};
