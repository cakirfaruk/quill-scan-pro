import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Rss, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareAnalysisButtonProps {
    analysisId: string;
    analysisType: "numerology" | "birth_chart" | "tarot" | "compatibility";
    analysisTitle: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export const ShareAnalysisButton = ({
    analysisId,
    analysisType,
    analysisTitle,
    variant = "outline",
    size = "default",
    className = "",
}: ShareAnalysisButtonProps) => {
    const { toast } = useToast();
    const [sharing, setSharing] = useState(false);

    const handleShareToFeed = async () => {
        setSharing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Giriş yapmalısınız");

            // Insert an analysis post
            const { error } = await supabase.from("posts").insert({
                user_id: user.id,
                content: `İşte benim ${analysisTitle} sonucum! ✨ Evrenin enerjisini keşfedin.`,
                post_type: "analysis",
                media_url: analysisId, // Store analysis ID here for rendering purposes, or use another column if schema allows
                media_type: analysisType,
            });

            if (error) throw error;

            toast({
                title: "Başarılı! 🌟",
                description: "Analiziniz sosyal akışta paylaşıldı.",
            });
        } catch (e: any) {
            toast({
                title: "Hata",
                description: e.message || "Paylaşım yapılamadı.",
                variant: "destructive",
            });
        } finally {
            setSharing(false);
        }
    };

    const handleShareViaDM = () => {
        // You could open a dialog to select friends here.
        // For now, simpler flow: copy link or inform user to use messages.
        // A full DM picker could be added if needed wrapper around this.
        toast({
            title: "Mesajla Gönder",
            description: "Mesajlar sekmesine gidip doğrudan bir arkadaşınıza gönderebilirsiniz.",
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className} disabled={sharing}>
                    {sharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                    Paylaş
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-black/90 border-white/10 text-white backdrop-blur-xl">
                <DropdownMenuItem onClick={handleShareToFeed} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-white">
                    <Rss className="w-4 h-4 mr-2 text-primary" />
                    Sosyal Akışta Paylaş
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaDM} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-white">
                    <MessageCircle className="w-4 h-4 mr-2 text-accent" />
                    Mesajla Gönder
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
