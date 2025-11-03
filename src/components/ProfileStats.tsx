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
      <Card className="p-4 text-center hover:shadow-lg transition-all cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-purple-500/10 rounded-full mb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{analysesCount}</p>
          <p className="text-xs text-muted-foreground">Analiz</p>
        </div>
      </Card>

      <Card className="p-4 text-center hover:shadow-lg transition-all cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-pink-500/10 rounded-full mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <p className="text-2xl font-bold">{friendsCount}</p>
          <p className="text-xs text-muted-foreground">Arkadaş</p>
        </div>
      </Card>

      <Card className="p-4 text-center hover:shadow-lg transition-all cursor-pointer">
        <div className="flex flex-col items-center">
          <div className="p-2 bg-blue-500/10 rounded-full mb-2">
            <Star className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{postsCount}</p>
          <p className="text-xs text-muted-foreground">Gönderi</p>
        </div>
      </Card>

      {compatibilityAvg !== undefined && (
        <Card className="p-4 text-center hover:shadow-lg transition-all cursor-pointer">
          <div className="flex flex-col items-center">
            <div className="p-2 bg-green-500/10 rounded-full mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">%{compatibilityAvg}</p>
            <p className="text-xs text-muted-foreground">Ort. Uyum</p>
          </div>
        </Card>
      )}
    </div>
  );
};