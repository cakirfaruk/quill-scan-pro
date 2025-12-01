import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ReferralCard = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Count referrals
      const { data: referrals, count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", user.id);

      setReferralCount(count || 0);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Kopyalandı",
      description: "Referans linkiniz panoya kopyalandı",
    });
  };

  if (loading) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Arkadaşını Davet Et
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Her davet için 50 kredi kazan!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={`${window.location.origin}/auth?ref=${referralCode}`}
            readOnly
            className="flex-1"
          />
          <Button onClick={copyReferralLink} size="icon">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Davet Ettiğin Arkadaşlar</span>
          </div>
          <Badge variant="secondary">{referralCount}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
