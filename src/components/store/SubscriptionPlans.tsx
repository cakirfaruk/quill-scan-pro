import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Sparkles, Infinity, Star } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  duration_type: string;
  duration_days: number;
  price_try: number;
  bonus_credits: number;
  features: string[];
  is_popular: boolean;
}

interface SubscriptionPlansProps {
  hasSubscription: boolean;
  onPurchaseComplete: () => void;
}

const SubscriptionPlans = ({ hasSubscription, onPurchaseComplete }: SubscriptionPlansProps) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("duration_days", { ascending: true });

    if (data) {
      setPlans(data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })));
    }
    setIsLoading(false);
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setPurchasingId(plan.id);
    
    toast({
      title: "Abonelik Başlatılıyor",
      description: `${plan.name} - ${plan.price_try.toFixed(2)}₺/${getDurationLabel(plan.duration_type)}`,
    });

    setTimeout(() => {
      toast({
        title: "Ödeme Sistemi",
        description: "Uygulama mağazasından abonelik işlemi başlatılacak.",
      });
      setPurchasingId(null);
    }, 1000);
  };

  const getDurationLabel = (type: string) => {
    switch (type) {
      case "weekly": return "hafta";
      case "monthly": return "ay";
      case "yearly": return "yıl";
      default: return type;
    }
  };

  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    switch (plan.duration_type) {
      case "weekly": return plan.price_try * 4.33;
      case "monthly": return plan.price_try;
      case "yearly": return plan.price_try / 12;
      default: return plan.price_try;
    }
  };

  const getSavingsPercent = (plan: SubscriptionPlan) => {
    if (plan.duration_type === "yearly") return 40;
    if (plan.duration_type === "monthly") return 20;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 mb-3">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">VIP Abonelik</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Sınırsız Erişim</h2>
        <p className="text-sm text-muted-foreground">
          Tüm analizlere sınırsız erişim ve özel ayrıcalıklar
        </p>
      </div>

      {hasSubscription && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
        >
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-600 dark:text-green-400">
            Aktif VIP Aboneliğiniz Var
          </p>
          <p className="text-sm text-muted-foreground">
            Tüm premium özelliklerden yararlanabilirsiniz
          </p>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => {
          const savings = getSavingsPercent(plan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden h-full flex flex-col ${
                plan.is_popular 
                  ? "border-2 border-primary shadow-xl shadow-primary/20 scale-105" 
                  : "border-border/50"
              }`}>
                {plan.is_popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-purple-500 text-primary-foreground text-xs font-bold py-1 text-center">
                    EN POPÜLER
                  </div>
                )}
                {savings > 0 && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white border-0">
                    %{savings} Tasarruf
                  </Badge>
                )}

                <CardHeader className={`text-center ${plan.is_popular ? "pt-8" : "pt-4"}`}>
                  <div className="mx-auto p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-3">
                    {plan.duration_type === "yearly" ? (
                      <Star className="w-8 h-8 text-yellow-500" />
                    ) : plan.duration_type === "monthly" ? (
                      <Crown className="w-8 h-8 text-yellow-500" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-yellow-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price_try.toFixed(2)}₺
                      </span>
                      <span className="text-muted-foreground mb-1">
                        /{getDurationLabel(plan.duration_type)}
                      </span>
                    </div>
                    {plan.duration_type !== "monthly" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{getMonthlyPrice(plan).toFixed(2)}₺/ay
                      </p>
                    )}
                  </div>

                  {plan.bonus_credits > 0 && (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 mb-4">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        +{plan.bonus_credits} Bonus Kredi
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={purchasingId === plan.id || hasSubscription}
                    className={`w-full mt-4 ${
                      plan.is_popular
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-500/90 hover:to-orange-500/90 text-white"
                        : ""
                    }`}
                  >
                    {purchasingId === plan.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : hasSubscription ? (
                      "Aktif Abonelik"
                    ) : (
                      "Abone Ol"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center space-y-2 pt-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Infinity className="w-4 h-4 text-primary" />
          <span>Sınırsız analiz ve Oracle sorusu</span>
        </div>
        <p className="text-xs text-muted-foreground">
          İstediğiniz zaman iptal edebilirsiniz. Abonelik otomatik yenilenir.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
