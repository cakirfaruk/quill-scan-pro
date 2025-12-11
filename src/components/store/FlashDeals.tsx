import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Loader2 } from "lucide-react";

interface FlashDeal {
  id: string;
  name: string;
  description: string;
  deal_type: string;
  original_price: number;
  deal_price: number;
  discount_percent: number;
  ends_at: string;
  icon: string;
}

interface FlashDealsProps {
  onPurchaseComplete?: () => void;
}

const FlashDeals = ({ onPurchaseComplete }: FlashDealsProps) => {
  const { toast } = useToast();
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, string> = {};
      deals.forEach(deal => {
        newTimeLeft[deal.id] = calculateTimeLeft(deal.ends_at);
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [deals]);

  const loadDeals = async () => {
    const { data, error } = await supabase
      .from("flash_deals")
      .select("*")
      .eq("is_active", true)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true });

    if (!error && data) {
      setDeals(data);
    }
    setIsLoading(false);
  };

  const calculateTimeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Bitti";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePurchase = async (deal: FlashDeal) => {
    setPurchasingId(deal.id);
    
    toast({
      title: "Satın Alma Başlatılıyor",
      description: "Ödeme ekranına yönlendiriliyorsunuz...",
    });

    // Simulate purchase - actual IAP integration needed
    setTimeout(() => {
      setPurchasingId(null);
      onPurchaseComplete?.();
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {deals.map((deal, index) => (
        <motion.div
          key={deal.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 p-4 border border-orange-500/30"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/10 to-pink-500/5 animate-pulse" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <Zap className="w-6 h-6" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{deal.icon}</span>
                  <h3 className="font-bold text-foreground">{deal.name}</h3>
                  <Badge className="bg-red-500 text-white border-0">
                    %{deal.discount_percent} İNDİRİM
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{deal.description}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg font-bold text-primary">{deal.deal_price} ₭</span>
                  <span className="text-sm text-muted-foreground line-through">{deal.original_price} ₭</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-orange-500">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{timeLeft[deal.id] || "..."}</span>
              </div>
              
              <Button
                onClick={() => handlePurchase(deal)}
                disabled={purchasingId === deal.id}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {purchasingId === deal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Hemen Al"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FlashDeals;
