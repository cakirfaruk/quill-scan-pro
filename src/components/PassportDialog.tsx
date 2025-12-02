import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plane, Clock, Coins, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface PassportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userCredits: number;
  onCreditsChanged?: () => void;
}

const PASSPORT_COST = 50;
const PASSPORT_DURATION_HOURS = 24;

const popularCities = [
  { name: "İstanbul", country: "Türkiye" },
  { name: "Ankara", country: "Türkiye" },
  { name: "İzmir", country: "Türkiye" },
  { name: "Antalya", country: "Türkiye" },
  { name: "Paris", country: "Fransa" },
  { name: "Londra", country: "İngiltere" },
  { name: "New York", country: "ABD" },
  { name: "Berlin", country: "Almanya" },
];

export const PassportDialog = ({
  open,
  onOpenChange,
  userId,
  userCredits,
  onCreditsChanged,
}: PassportDialogProps) => {
  const { toast } = useToast();
  const [activePassport, setActivePassport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadActivePassport();
    }
  }, [open, userId]);

  const loadActivePassport = async () => {
    try {
      const { data } = await supabase
        .from("passport_locations")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      setActivePassport(data);
    } catch (error) {
      console.error("Error loading passport:", error);
    } finally {
      setLoading(false);
    }
  };

  const activatePassport = async (location: string) => {
    if (userCredits < PASSPORT_COST) {
      toast({
        title: "Yetersiz Kredi",
        description: `Passport için ${PASSPORT_COST} kredi gerekiyor.`,
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    try {
      // Deduct credits
      const { error: creditError } = await supabase.rpc("deduct_credits_atomic", {
        p_user_id: userId,
        p_amount: PASSPORT_COST,
        p_transaction_type: "passport",
        p_description: `Passport: ${location}`,
      });

      if (creditError) throw creditError;

      // Set expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + PASSPORT_DURATION_HOURS);

      // Create/update passport
      const { error: passportError } = await supabase.from("passport_locations").upsert({
        user_id: userId,
        virtual_location: location,
        expires_at: expiresAt.toISOString(),
        credits_used: PASSPORT_COST,
      });

      if (passportError) throw passportError;

      await loadActivePassport();
      onCreditsChanged?.();

      toast({
        title: "Passport Aktif!",
        description: `Şimdi ${location} konumunda görünüyorsunuz.`,
      });
    } catch (error) {
      console.error("Error activating passport:", error);
      toast({
        title: "Hata",
        description: "Passport aktifleştirilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const deactivatePassport = async () => {
    try {
      await supabase.from("passport_locations").delete().eq("user_id", userId);

      setActivePassport(null);
      toast({
        title: "Passport Devre Dışı",
        description: "Gerçek konumunuza döndünüz.",
      });
    } catch (error) {
      console.error("Error deactivating passport:", error);
    }
  };

  const filteredCities = popularCities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Passport
          </DialogTitle>
          <DialogDescription>
            Farklı bir konumda görünerek yeni insanlarla tanışın
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activePassport ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="gap-1">
                  <Plane className="w-3 h-3" />
                  Aktif
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={deactivatePassport}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">{activePassport.virtual_location}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activePassport.expires_at), {
                      addSuffix: true,
                      locale: tr,
                    })}{" "}
                    sona erecek
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              Match sayfasında bu konumdaki kullanıcılar gösterilecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Cost Info */}
            <Card className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Passport Ücreti</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{PASSPORT_COST} Kredi</Badge>
                <span className="text-xs text-muted-foreground">
                  {PASSPORT_DURATION_HOURS} saat
                </span>
              </div>
            </Card>

            {/* Search */}
            <Input
              placeholder="Şehir ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />

            {/* City Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {filteredCities.map((city) => (
                <Button
                  key={city.name}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => activatePassport(`${city.name}, ${city.country}`)}
                  disabled={isActivating || userCredits < PASSPORT_COST}
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{city.name}</p>
                    <p className="text-xs text-muted-foreground">{city.country}</p>
                  </div>
                </Button>
              ))}
            </div>

            {userCredits < PASSPORT_COST && (
              <p className="text-sm text-destructive text-center">
                Yetersiz kredi. {PASSPORT_COST - userCredits} kredi daha gerekli.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
