import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Crown, Package, Sparkles, Shield, Clock, Zap } from "lucide-react";
import CreditPackages from "@/components/store/CreditPackages";
import SubscriptionPlans from "@/components/store/SubscriptionPlans";
import TimeBasedPackages from "@/components/store/TimeBasedPackages";
import AnalysisPrices from "@/components/store/AnalysisPrices";
import FlashDeals from "@/components/store/FlashDeals";
import ActivePackages from "@/components/store/ActivePackages";

const Store = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan_name: string;
    days_remaining: number;
  } | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load user credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setUserCredits(profile.credits || 0);
    }

    // Check subscription
    const { data: subData } = await supabase
      .rpc("get_user_subscription", { p_user_id: user.id });

    if (subData && subData.length > 0) {
      setHasSubscription(true);
      setSubscriptionInfo({
        plan_name: subData[0].plan_name,
        days_remaining: subData[0].days_remaining
      });
    }

    setIsLoading(false);
  };

  const trustBadges = [
    { icon: Shield, label: "Güvenli Ödeme", color: "text-green-500" },
    { icon: Zap, label: "Anında Teslimat", color: "text-yellow-500" },
    { icon: Clock, label: "7/24 Destek", color: "text-blue-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* User Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 p-6 border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                  <Coins className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mevcut Krediniz</p>
                  <p className="text-3xl font-bold text-foreground">{userCredits} ₭</p>
                </div>
              </div>
              
              {hasSubscription && subscriptionInfo && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {subscriptionInfo.plan_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscriptionInfo.days_remaining} gün kaldı
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Active Packages */}
        <ActivePackages />

        {/* Flash Deals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <FlashDeals onPurchaseComplete={checkAuthAndLoadData} />
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm"
            >
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <span className="text-muted-foreground">{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="packages" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg relative"
            >
              <Package className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Paketler</span>
              <Badge className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-gradient-to-r from-green-500 to-emerald-500 border-0">
                YENİ
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="credits" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Coins className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Krediler</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg relative"
            >
              <Crown className="w-4 h-4" />
              <span className="text-xs sm:text-sm">VIP</span>
              <Badge className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                POPÜLER
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="prices" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Fiyatlar</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="packages" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TimeBasedPackages onPurchaseComplete={checkAuthAndLoadData} />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="credits" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CreditPackages onPurchaseComplete={checkAuthAndLoadData} />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="subscriptions" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SubscriptionPlans 
                  hasSubscription={hasSubscription} 
                  onPurchaseComplete={checkAuthAndLoadData} 
                />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="prices" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AnalysisPrices />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default Store;
