import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VirtualGiftsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
}

export const VirtualGiftsDialog = ({ 
  isOpen, 
  onClose, 
  receiverId,
  receiverName 
}: VirtualGiftsDialogProps) => {
  const [gifts, setGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadGifts();
      loadCredits();
    }
  }, [isOpen]);

  const loadGifts = async () => {
    try {
      const { data, error } = await supabase
        .from("virtual_gifts")
        .select("*")
        .eq("is_active", true)
        .order("cost_credits");

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error("Error loading gifts:", error);
    }
  };

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      setCredits(data?.credits || 0);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast({
        title: "Hata",
        description: "Lütfen bir hediye seçin",
        variant: "destructive",
      });
      return;
    }

    if (credits < selectedGift.cost_credits) {
      toast({
        title: "Yetersiz Kredi",
        description: "Bu hediyeyi göndermeniz için yeterli krediniz yok",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Send gift
      const { error: giftError } = await supabase
        .from("gift_transactions")
        .insert({
          gift_id: selectedGift.id,
          sender_id: user.id,
          receiver_id: receiverId,
          message: message || null,
        });

      if (giftError) throw giftError;

      // Deduct credits
      const { error: creditError } = await supabase.rpc("deduct_credits_atomic", {
        p_user_id: user.id,
        p_amount: selectedGift.cost_credits,
        p_transaction_type: "gift_sent",
        p_description: `${receiverName} kullanıcısına hediye gönderildi`,
      });

      if (creditError) throw creditError;

      toast({
        title: "Başarılı",
        description: "Hediyeniz gönderildi!",
      });

      onClose();
    } catch (error: any) {
      console.error("Error sending gift:", error);
      toast({
        title: "Hata",
        description: error.message || "Hediye gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {receiverName} için Hediye Seç
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Mevcut Krediniz: <Badge variant="secondary">{credits}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => (
              <Button
                key={gift.id}
                variant={selectedGift?.id === gift.id ? "default" : "outline"}
                className="h-auto flex-col gap-2 p-4"
                onClick={() => setSelectedGift(gift)}
              >
                <span className="text-3xl">{gift.icon}</span>
                <span className="text-sm font-medium">{gift.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {gift.cost_credits} kredi
                </Badge>
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="İsteğe bağlı mesaj ekle..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button 
              onClick={handleSendGift} 
              disabled={loading || !selectedGift}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gönder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
