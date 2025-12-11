import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Sparkles, Loader2, TrendingDown, Calendar, Infinity, CheckCircle } from "lucide-react";

interface TimeBasedPackage {
  id: string;
  name: string;
  description: string;
  package_type: string;
  duration_days: number;
  usage_limit: number | null;
  credit_cost: number;
  original_credit_value: number;
  icon: string;
  category: string;
}

interface TimeBasedPackagesProps {
  onPurchaseComplete?: () => void;
}

const TimeBasedPackages = ({ onPurchaseComplete }: TimeBasedPackagesProps) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<TimeBasedPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("horoscope");

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from("time_based_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setPackages(data);
    }
    setIsLoading(false);
  };

  const handlePurchase = async (pkg: TimeBasedPackage) => {
    setPurchasingId(pkg.id);
    
    toast({
      title: "Satın Alma Başlatılıyor",
      description: "Paket satın alma işlemi başlatılıyor...",
    });

    // Simulate purchase - actual IAP integration needed
    setTimeout(() => {
      setPurchasingId(null);
      toast({
        title: "Paket Aktifleştirildi! 🎉",
        description: `${pkg.name} paketiniz aktif edildi.`,
      });
      onPurchaseComplete?.();
    }, 1500);
  };

  const getSavingsPercent = (pkg: TimeBasedPackage) => {
    return Math.round(((pkg.original_credit_value - pkg.credit_cost) / pkg.original_credit_value) * 100);
  };

  const getDurationLabel = (days: number) => {
    if (days === 1) return "Günlük";
    if (days === 7) return "Haftalık";
    if (days === 30) return "Aylık";
    if (days === 90) return "3 Aylık";
    if (days === 365) return "Yıllık";
    return `${days} Gün`;
  };

  const categories = [
    { id: "horoscope", label: "Burç", icon: "🌅" },
    { id: "fortune", label: "Fal", icon: "🎴" },
    { id: "oracle", label: "Oracle", icon: "🔮" },
    { id: "match", label: "Eşleşme", icon: "💘" },
    { id: "bundle", label: "Paketler", icon: "🌟" },
  ];

  const filteredPackages = packages.filter(p => p.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="rounded-full"
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Package Cards */}
      <div className="grid gap-4">
        {filteredPackages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Bu kategoride paket bulunmuyor.
          </div>
        ) : (
          filteredPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-4"
            >
              {/* Savings Badge */}
              {getSavingsPercent(pkg) >= 30 && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  %{getSavingsPercent(pkg)} Tasarruf
                </Badge>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{pkg.icon}</div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {getDurationLabel(pkg.duration_days)}
                      </Badge>
                      
                      <Badge variant="secondary" className="text-xs">
                        {pkg.usage_limit ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {pkg.usage_limit} Kullanım
                          </>
                        ) : (
                          <>
                            <Infinity className="w-3 h-3 mr-1" />
                            Sınırsız
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">{pkg.credit_cost} ₭</span>
                      <span className="text-sm text-muted-foreground line-through">
                        {pkg.original_credit_value} ₭
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasingId === pkg.id}
                    className="w-full sm:w-auto"
                  >
                    {purchasingId === pkg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Satın Al
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TimeBasedPackages;
