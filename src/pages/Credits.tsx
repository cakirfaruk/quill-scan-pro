import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      title: "Demo Mod",
      description: `${pkg.name} satın alma işlemi simüle edildi. ${pkg.credits} kredi hesabınıza ekleniyor...`,
    });

    // Simulate purchase - in production, integrate payment gateway
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ credits: profile.credits + pkg.credits })
          .eq("user_id", user.id);

        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: pkg.credits,
          transaction_type: "purchase",
          description: `${pkg.name} satın alındı`,
        });

        toast({
          title: "Başarılı!",
          description: `${pkg.credits} kredi hesabınıza eklendi.`,
        });

        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "İşlem tamamlanamadı.",
        variant: "destructive",
      });
    }
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
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Krediler Nasıl Kullanılır?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">1 kredi</div>
                <p className="text-sm text-muted-foreground">Her analiz başlığı için</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">13 kredi</div>
                <p className="text-sm text-muted-foreground">Tam analiz için</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">50 kredi</div>
                <p className="text-sm text-muted-foreground">Uyum analizi için</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Credits;