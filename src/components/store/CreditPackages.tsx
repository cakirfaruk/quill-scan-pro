import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, TrendingUp, Star } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price_try: number;
}

interface CreditPackagesProps {
  onPurchaseComplete: () => void;
}

const CreditPackages = ({ onPurchaseComplete }: CreditPackagesProps) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("credits", { ascending: true });

    if (data) {
      setPackages(data);
    }
    setIsLoading(false);
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasingId(pkg.id);
    
    // In production, this would trigger IAP
    toast({
      title: "Satın Alma Başlatılıyor",
      description: `${pkg.name} - ${pkg.price_try.toFixed(2)}₺`,
    });

    // Simulate IAP process
    setTimeout(() => {
      toast({
        title: "Ödeme Sistemi",
        description: "Uygulama mağazasından satın alma işlemi başlatılacak.",
      });
      setPurchasingId(null);
    }, 1000);
  };

  const getPackageIcon = (index: number) => {
    const icons = [Coins, Coins, Star, TrendingUp, Sparkles];
    return icons[index] || Coins;
  };

  const getPackageGradient = (index: number) => {
    const gradients = [
      "from-blue-500/20 to-cyan-500/20",
      "from-green-500/20 to-emerald-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-orange-500/20 to-red-500/20",
      "from-yellow-500/20 to-amber-500/20"
    ];
    return gradients[index] || gradients[0];
  };

  const getBestValue = (pkg: CreditPackage) => {
    return (pkg.credits / pkg.price_try * 10).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Kredi Paketleri</h2>
        <p className="text-sm text-muted-foreground">
          Daha fazla kredi, daha fazla analiz imkanı
        </p>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg, index) => {
          const Icon = getPackageIcon(index);
          const isPopular = index === 1;
          const isBestValue = index === packages.length - 1;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                isPopular ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}>
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-purple-500 text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    EN POPÜLER
                  </div>
                )}
                {isBestValue && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    EN AVANTAJLI
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getPackageGradient(index)}`}>
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {pkg.credits} ₭
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({getBestValue(pkg)} ₭/₺)
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasingId === pkg.id}
                      className={`min-w-[100px] ${
                        isPopular 
                          ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90" 
                          : ""
                      }`}
                    >
                      {purchasingId === pkg.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        `${pkg.price_try.toFixed(2)}₺`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-6">
        Tüm satın almalar App Store veya Google Play üzerinden güvenle gerçekleştirilir.
      </p>
    </div>
  );
};

export default CreditPackages;
