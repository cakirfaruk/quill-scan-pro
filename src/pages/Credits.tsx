import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, CheckCircle2, Sparkles } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_try: number;
  description: string;
}

const Credits = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Premium features pricing
  const premiumFeatures = [
    { icon: "⚡", name: "Super Like", description: "Özel ilgi göster, öne çık", cost: 10 },
    { icon: "🚀", name: "Boost", description: "30 dakika profilini öne çıkar", cost: 20 },
    { icon: "↩️", name: "Geri Al", description: "Son eylemi geri al", cost: 5 },
    { icon: "❤️", name: "Normal Beğeni", description: "Profil beğen", cost: 5 },
    { icon: "➡️", name: "Geç", description: "Profili atla", cost: 1 },
  ];

  useEffect(() => {
    checkAuth();
    loadPackages();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("credits", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Paketler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    toast({
      title: "Ödeme Altyapısı Hazırlanıyor",
      description: "Ödeme sistemi yakında aktif olacak. Lütfen daha sonra tekrar deneyin.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-primary rounded-full mb-4">
            <Coins className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Kredi Paketleri
          </h1>
          <p className="text-lg text-muted-foreground">
            İhtiyacınıza uygun paketi seçin ve analize başlayın
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => (
            <Card
              key={pkg.id}
              className={`p-6 relative overflow-hidden transition-all hover:shadow-elegant ${
                index === packages.length - 1 ? "border-2 border-primary" : ""
              }`}
            >
              {index === packages.length - 1 && (
                <div className="absolute top-4 right-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </div>

                <div className="py-6 border-y border-border">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {pkg.credits}
                    </div>
                    <div className="text-sm text-muted-foreground">kredi</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1 text-3xl font-bold text-foreground">
                    <span>{pkg.price_try.toFixed(2)}</span>
                    <span className="text-lg">₺</span>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    ~{(pkg.price_try / pkg.credits).toFixed(2)} ₺ / kredi
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Satın Al
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Krediler Nasıl Kullanılır?</h2>
              <p className="text-sm text-muted-foreground">Her özellik için farklı kredi miktarı gerekir</p>
            </div>
            
            {/* Analysis costs */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📊 Analiz Maliyetleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-primary mb-1">1 kredi</div>
                  <p className="text-sm text-muted-foreground">Her analiz başlığı için</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-primary mb-1">13 kredi</div>
                  <p className="text-sm text-muted-foreground">Tam analiz için</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border">
                  <div className="text-2xl font-bold text-primary mb-1">50 kredi</div>
                  <p className="text-sm text-muted-foreground">Uyum analizi için</p>
                </div>
              </div>
            </div>

            {/* Match features */}
            <div>
              <h3 className="text-lg font-semibold mb-3">💝 Eşleşme Özellikleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="p-3 rounded-lg bg-background/50 border hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{feature.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{feature.name}</span>
                          <Badge variant="secondary" className="text-xs">{feature.cost}₭</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Credits;