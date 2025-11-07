import { Card } from "@/components/ui/card";
import { Star, Heart, Sparkles, TrendingUp, Eye, MessageSquare, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
  analysesCount: number;
  friendsCount: number;
  postsCount?: number;
  compatibilityAvg?: number;
  totalLikes?: number;
  totalComments?: number;
  profileViews?: number;
}

export const ProfileStats = ({
  analysesCount,
  friendsCount,
  postsCount = 0,
  compatibilityAvg,
  totalLikes = 0,
  totalComments = 0,
  profileViews = 0,
}: ProfileStatsProps) => {
  const stats = [
    {
      icon: Sparkles,
      value: analysesCount,
      label: "Analiz",
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Heart,
      value: friendsCount,
      label: "Arkadaş",
      color: "pink",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Star,
      value: postsCount,
      label: "Gönderi",
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Heart,
      value: totalLikes,
      label: "Toplam Beğeni",
      color: "red",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: MessageSquare,
      value: totalComments,
      label: "Toplam Yorum",
      color: "green",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Eye,
      value: profileViews,
      label: "Profil Görüntüleme",
      color: "indigo",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  // Add compatibility if provided
  if (compatibilityAvg !== undefined) {
    stats.push({
      icon: TrendingUp,
      value: compatibilityAvg,
      label: "Ort. Uyum",
      color: "emerald",
      gradient: "from-emerald-500 to-green-500",
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <Card className={cn(
            "p-4 text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden",
            "hover:border-transparent"
          )}>
            {/* Animated background gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
              stat.gradient
            )} />
            
            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "p-3 rounded-full mb-3 transition-all duration-300 bg-gradient-to-br",
                  stat.gradient,
                  "bg-opacity-10 group-hover:bg-opacity-20"
                )}
              >
                <stat.icon className={cn("w-6 h-6", `text-${stat.color}-500`)} />
              </motion.div>
              
              <motion.p
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "text-2xl sm:text-3xl font-bold mb-1 transition-all duration-300 bg-gradient-to-br bg-clip-text",
                  stat.gradient,
                  "group-hover:text-transparent"
                )}
              >
                {stat.label === "Ort. Uyum" ? `%${stat.value}` : stat.value}
              </motion.p>
              
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};