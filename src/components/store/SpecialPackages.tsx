import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Tag, Sparkles, Clock } from "lucide-react";

interface PackageItem {
  type: string;
  count: number;
  label: string;
}

interface SpecialPackage {
  id: string;
  name: string;
  description: string;
  icon: string;
  price_try: number;
  original_price_try: number | null;
  included_items: PackageItem[];
  discount_percentage: number;
  is_featured: boolean;
  is_limited_time: boolean;
  expires_at: string | null;
}

interface SpecialPackagesProps {
  onPurchaseComplete: () => void;
}

const SpecialPackages = ({ onPurchaseComplete }: SpecialPackagesProps) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<SpecialPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from("special_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (data) {
      setPackages(data.map(p => ({
        ...p,
        included_items: Array.isArray(p.included_items) 
          ? p.included_items 
          : JSON.parse(p.included_items as string || '[]')
      })));
    }
    setIsLoading(false);
  };

  const handlePurchase = async (pkg: SpecialPackage) => {
    setPurchasingId(pkg.id);
    
    toast({
      title: "Satın Alma Başlatılıyor",
      description: `${pkg.name} - ${pkg.price_try.toFixed(2)}₺`,
    });

    setTimeout(() => {
      toast({
        title: "Ödeme Sistemi",
        description: "Uygulama mağazasından satın alma işlemi başlatılacak.",
      });
      setPurchasingId(null);
    }, 1000);
  };

  const getItemIcon = (type: string) => {
    const icons: Record<string, string> = {
      tarot: "🎴",
      coffee: "☕",
      dream: "🌙",
      compatibility: "💕",
      birth_chart: "🌟",
      numerology: "🔢",
      palmistry: "🖐️",
      oracle_unlimited: "🔮",
      credits: "💎"
    };
    return icons[type] || "✨";
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const featuredPackages = packages.filter(p => p.is_featured);
  const regularPackages = packages.filter(p => !p.is_featured);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 mb-3">
          <Gift className="w-5 h-5 text-pink-500" />
          <span className="font-semibold text-pink-600 dark:text-pink-400">Özel Paketler</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">İndirimli Fırsatlar</h2>
        <p className="text-sm text-muted-foreground">
          Birden fazla hizmeti bir arada, indirimli fiyatlarla alın
        </p>
      </div>

      {/* Featured Packages */}
      {featuredPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Öne Çıkanlar
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
                  {pkg.discount_percentage > 0 && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                      <Tag className="w-3 h-3 mr-1" />
                      %{pkg.discount_percentage} İndirim
                    </Badge>
                  )}
                  {pkg.is_limited_time && (
                    <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0">
                      <Clock className="w-3 h-3 mr-1" />
                      Sınırlı Süre
                    </Badge>
                  )}

                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{pkg.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {pkg.included_items.map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {getItemIcon(item.type)} {item.count}x {item.label}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-foreground">
                              {pkg.price_try.toFixed(2)}₺
                            </span>
                            {pkg.original_price_try && (
                              <span className="text-sm text-muted-foreground line-through">
                                {pkg.original_price_try.toFixed(2)}₺
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => handlePurchase(pkg)}
                            disabled={purchasingId === pkg.id}
                            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          >
                            {purchasingId === pkg.id ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-1" />
                                Satın Al
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Packages */}
      {regularPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Diğer Paketler
          </h3>
          <div className="grid gap-3">
            {regularPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (featuredPackages.length + index) * 0.1 }}
              >
                <Card className="overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{pkg.icon}</div>
                        <div>
                          <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pkg.included_items.map((item, i) => (
                              <span key={i} className="text-xs text-muted-foreground">
                                {getItemIcon(item.type)} {item.count}x {item.label}
                                {i < pkg.included_items.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {pkg.price_try.toFixed(2)}₺
                          </div>
                          {pkg.original_price_try && (
                            <div className="text-xs text-muted-foreground line-through">
                              {pkg.original_price_try.toFixed(2)}₺
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(pkg)}
                          disabled={purchasingId === pkg.id}
                        >
                          {purchasingId === pkg.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Al"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialPackages;
