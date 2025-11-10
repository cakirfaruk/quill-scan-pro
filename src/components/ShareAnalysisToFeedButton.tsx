import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ShareAnalysisToFeedButtonProps {
  analysisType: string;
  analysisResult: any;
  title: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ShareAnalysisToFeedButton = ({ 
  analysisType,
  analysisResult,
  title,
  variant = "outline", 
  size = "sm",
  className = ""
}: ShareAnalysisToFeedButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [content, setContent] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const generateSummary = () => {
    // Generate a short summary based on analysis type
    switch (analysisType) {
      case 'tarot':
        return `🔮 Tarot falıma baktım! ${analysisResult.cards?.length || 0} kart açtım.`;
      case 'numerology':
        return `🔢 Numeroloji analizimi yaptırdım! Kader rakamlarım ve yaşam yolum hakkında ilginç bilgiler edindim.`;
      case 'coffee_fortune':
        return `☕ Kahve falıma baktım! Fincanımda ilginç semboller gördüm.`;
      case 'palmistry':
        return `🖐️ El falıma baktım! Avucumdaki çizgiler gelecek hakkında ipuçları veriyor.`;
      case 'dream':
        return `💭 Rüya yorumumu yaptırdım! Rüyamdaki semboller çok anlamlıymış.`;
      case 'birth_chart':
        return `⭐ Doğum haritamı çıkardım! Yıldızlarım hakkında detaylı bilgi edindim.`;
      case 'compatibility':
        return `💑 Uyumluluk analizimi yaptırdım! İlişkimiz hakkında güzel öngörüler var.`;
      case 'horoscope':
        return `🌟 Günlük burç yorumumu aldım! Bugün için harika öneriler var.`;
      default:
        return `✨ ${title} analizimi yaptırdım!`;
    }
  };

  const handleShare = async () => {
    if (!user?.id) {
      toast({
        title: "Hata",
        description: "Paylaşmak için giriş yapmalısınız",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir açıklama yazın",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    try {
      // Create a post with analysis reference
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          analysis_type: analysisType,
          analysis_data: analysisResult
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Analiz sonucunuz feed'de paylaşıldı!",
      });

      setShowDialog(false);
      setContent("");
    } catch (error: any) {
      console.error('Share to feed error:', error);
      toast({
        title: "Hata",
        description: error.message || "Paylaşırken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => {
          setContent(generateSummary());
          setShowDialog(true);
        }}
      >
        <Share2 className="w-4 h-4" />
        Feed'de Paylaş
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Feed'de Paylaş
            </DialogTitle>
            <DialogDescription>
              Analiz sonucunuzu arkadaşlarınızla paylaşın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Analiz sonucunuz hakkında bir şeyler yazın..."
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/500
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <p className="text-sm font-medium">Paylaşılacak:</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSharing}
              >
                İptal
              </Button>
              <Button
                onClick={handleShare}
                disabled={isSharing || !content.trim()}
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Paylaşılıyor...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Paylaş
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
