import { Card } from "@/components/ui/card";
import { Star, Heart, Sparkles, TrendingUp } from "lucide-react";

interface ProfileStatsProps {
  analysesCount: number;
  friendsCount: number;
  postsCount?: number;
  compatibilityAvg?: number;
}

export const ProfileStats = ({
  analysesCount,
  friendsCount,
  postsCount = 0,
  compatibilityAvg,
}: ProfileStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="p-4 text-center group hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-purple-500/30">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-purple-500/10 rounded-full mb-2 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
            <Sparkles className="w-5 h-5 text-purple-500 group-hover:animate-pulse" />
          </div>
          <p className="text-2xl font-bold group-hover:text-purple-500 transition-colors">{analysesCount}</p>
          <p className="text-xs text-muted-foreground">Analiz</p>
        </div>
      </Card>

      <Card className="p-4 text-center group hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-pink-500/30">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-pink-500/10 rounded-full mb-2 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
            <Heart className="w-5 h-5 text-pink-500 group-hover:animate-pulse" />
          </div>
          <p className="text-2xl font-bold group-hover:text-pink-500 transition-colors">{friendsCount}</p>
          <p className="text-xs text-muted-foreground">Arkadaş</p>
        </div>
      </Card>

      <Card className="p-4 text-center group hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-blue-500/30">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-blue-500/10 rounded-full mb-2 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
            <Star className="w-5 h-5 text-blue-500 group-hover:animate-pulse" />
          </div>
          <p className="text-2xl font-bold group-hover:text-blue-500 transition-colors">{postsCount}</p>
          <p className="text-xs text-muted-foreground">Gönderi</p>
        </div>
      </Card>

      {compatibilityAvg !== undefined && (
        <Card className="p-4 text-center group hover:shadow-elegant hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-green-500/30">
          <div className="flex flex-col items-center">
            <div className="p-2 bg-green-500/10 rounded-full mb-2 group-hover:scale-110 group-hover:bg-green-500/20 transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-green-500 group-hover:animate-pulse" />
            </div>
            <p className="text-2xl font-bold group-hover:text-green-500 transition-colors">%{compatibilityAvg}</p>
            <p className="text-xs text-muted-foreground">Ort. Uyum</p>
          </div>
        </Card>
      )}
    </div>
  );
};