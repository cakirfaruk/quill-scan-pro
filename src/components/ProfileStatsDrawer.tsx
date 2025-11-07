import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Heart, MessageSquare, Eye, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLikes: number;
  totalComments: number;
  profileViews: number;
  compatibilityAvg?: number;
}

export const ProfileStatsDrawer = ({
  open,
  onOpenChange,
  totalLikes,
  totalComments,
  profileViews,
  compatibilityAvg,
}: ProfileStatsDrawerProps) => {
  const isMobile = useIsMobile();

  const stats = [
    {
      icon: Heart,
      value: totalLikes,
      label: "Toplam Beğeni",
      description: "Gönderilerinize yapılan toplam beğeni sayısı",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: MessageSquare,
      value: totalComments,
      label: "Toplam Yorum",
      description: "Gönderilerinize yapılan toplam yorum sayısı",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Eye,
      value: profileViews,
      label: "Profil Görüntüleme",
      description: "Profilinizin kaç kez görüntülendiği",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  if (compatibilityAvg !== undefined) {
    stats.push({
      icon: TrendingUp,
      value: compatibilityAvg,
      label: "Ortalama Uyum",
      description: "Uyumluluk analizlerinizin ortalaması",
      gradient: "from-emerald-500 to-green-500",
    });
  }

  const content = (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Etkileşim İstatistikleri</h3>
      </div>

      <div className="grid gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-full bg-gradient-to-br",
                  stat.gradient,
                  "bg-opacity-10"
                )}>
                  <stat.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={cn(
                      "text-2xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                      stat.gradient
                    )}>
                      {stat.label === "Ortalama Uyum" ? `%${stat.value}` : stat.value}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detaylı İstatistikler</DrawerTitle>
            <DrawerDescription>
              Profilinize ait detaylı etkileşim metrikleri
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detaylı İstatistikler</DialogTitle>
          <DialogDescription>
            Profilinize ait detaylı etkileşim metrikleri
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
