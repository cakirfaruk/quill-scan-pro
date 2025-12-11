import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Coins, RefreshCw, Clock, ArrowRight } from "lucide-react";

interface AnalysisPrice {
  id: string;
  analysis_type: string;
  credit_cost: number;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  is_repeatable: boolean;
  cooldown_hours: number;
}

const AnalysisPrices = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<AnalysisPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    const { data, error } = await supabase
      .from("analysis_prices")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (data) {
      setPrices(data);
    }
    setIsLoading(false);
  };

  const getAnalysisRoute = (type: string) => {
    const routes: Record<string, string> = {
      daily_horoscope: "/daily-horoscope",
      oracle: "/oracle",
      dream: "/dream-interpretation",
      tarot: "/tarot",
      coffee: "/coffee-fortune",
      palmistry: "/palmistry",
      numerology: "/numerology",
      birth_chart: "/birth-chart",
      compatibility: "/compatibility"
    };
    return routes[type] || "/";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      horoscope: "Burç",
      oracle: "Oracle",
      interpretation: "Yorum",
      fortune: "Fal",
      analysis: "Analiz",
      compatibility: "Uyumluluk"
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      horoscope: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      oracle: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      interpretation: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      fortune: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      analysis: "bg-green-500/10 text-green-600 dark:text-green-400",
      compatibility: "bg-red-500/10 text-red-600 dark:text-red-400"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 mb-3">
          <Coins className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">Analiz Fiyatları</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Hizmet Ücretleri</h2>
        <p className="text-sm text-muted-foreground">
          Her bir analiz için gereken kredi miktarları
        </p>
      </div>

      {/* Price Comparison Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 rounded-lg bg-primary/10">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">1 Kredi = ~10₺ Değerinde</p>
              <p className="text-muted-foreground">VIP aboneler tüm hizmetlere sınırsız erişir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price List */}
      <div className="space-y-3">
        {prices.map((price, index) => (
          <motion.div
            key={price.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:border-primary/30 transition-all hover:shadow-md group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{price.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{price.display_name}</h3>
                        <Badge className={`text-xs ${getCategoryColor(price.category)}`}>
                          {getCategoryLabel(price.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{price.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {price.is_repeatable ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <RefreshCw className="w-3 h-3" />
                            Tekrarlanabilir
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <Clock className="w-3 h-3" />
                            Tek Seferlik
                          </span>
                        )}
                        {price.cooldown_hours > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({price.cooldown_hours} saat bekleme)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10">
                      <Coins className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">{price.credit_cost}</span>
                      <span className="text-sm text-primary/70">₭</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(getAnalysisRoute(price.analysis_type))}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-2 pt-4 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>İpucu:</strong> VIP abonelik ile tüm analizlere sınırsız erişim elde edin
        </p>
        <Button
          variant="outline"
          onClick={() => {
            const tabsList = document.querySelector('[role="tablist"]');
            const subscriptionsTab = tabsList?.querySelector('[value="subscriptions"]') as HTMLButtonElement;
            subscriptionsTab?.click();
          }}
        >
          VIP Planları İncele
        </Button>
      </div>
    </div>
  );
};

export default AnalysisPrices;
