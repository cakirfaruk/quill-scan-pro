import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Moon, Heart, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AnalysisDetailView } from "./AnalysisDetailView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SharedAnalysisCardProps {
    analysisId: string;
    analysisType: "numerology" | "birth_chart" | "tarot" | "compatibility" | string;
    previewMatchContext?: any; // If passed from message contextual data
    compact?: boolean;
}

export const SharedAnalysisCard = ({ analysisId, analysisType, previewMatchContext, compact = false }: SharedAnalysisCardProps) => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showFull, setShowFull] = useState(false);
    const [ownerInfo, setOwnerInfo] = useState<{ name: string, photo: string | null } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let rawData = null;
                let ownerId = null;

                if (analysisType === "numerology") {
                    const { data: numData } = await supabase.from("numerology_analyses").select("*").eq("id", analysisId).maybeSingle();
                    if (numData) {
                        rawData = numData.result;
                        ownerId = numData.user_id;
                    }
                } else if (analysisType === "birth_chart") {
                    const { data: bcData } = await supabase.from("birth_chart_analyses").select("*").eq("id", analysisId).maybeSingle();
                    if (bcData) {
                        rawData = bcData.result;
                        ownerId = bcData.user_id;
                    }
                } else if (analysisType === "tarot" || analysisType === "compatibility") {
                    const { data: matchData } = await supabase.from("matches").select("*").eq("id", analysisId).maybeSingle();
                    if (matchData) {
                        rawData = analysisType === "tarot" ? matchData.tarot_reading : matchData.compatibility_numerology; // Simplified for display
                        // For matches, we don't have a single owner but rather two participants
                        setOwnerInfo({ name: "Ruhsal Bağ", photo: null });
                    }
                }

                if (ownerId) {
                    const { data: profile } = await supabase.from("profiles").select("full_name, username, profile_photo").eq("id", ownerId).maybeSingle();
                    if (profile) {
                        setOwnerInfo({ name: profile.full_name || profile.username, photo: profile.profile_photo });
                    }
                }

                setData(rawData);
            } catch (e) {
                console.error("Error loading shared analysis:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [analysisId, analysisType]);

    const getThemeColors = () => {
        switch (analysisType) {
            case "numerology": return { wrapper: "from-purple-900/50 to-indigo-900/50", border: "border-purple-500/30", text: "text-purple-300", icon: <Star className="w-5 h-5 text-purple-400" /> };
            case "birth_chart": return { wrapper: "from-blue-900/50 to-cyan-900/50", border: "border-cyan-500/30", text: "text-cyan-300", icon: <Sparkles className="w-5 h-5 text-cyan-400" /> };
            case "tarot": return { wrapper: "from-violet-900/50 to-fuchsia-900/50", border: "border-violet-500/30", text: "text-violet-300", icon: <Moon className="w-5 h-5 text-violet-400" /> };
            case "compatibility": return { wrapper: "from-pink-900/50 to-rose-900/50", border: "border-pink-500/30", text: "text-pink-300", icon: <Heart className="w-5 h-5 text-pink-400" /> };
            default: return { wrapper: "from-gray-900/50 to-slate-900/50", border: "border-white/10", text: "text-white/80", icon: <Sparkles className="w-5 h-5 text-white/50" /> };
        }
    };

    const getTitle = () => {
        switch (analysisType) {
            case "numerology": return "Numeroloji Analizi";
            case "birth_chart": return "Doğum Haritası";
            case "tarot": return "Tarot Açılımı";
            case "compatibility": return "Evrensel Uyum";
            default: return "Kozmik Analiz";
        }
    };

    const getSummaryText = () => {
        if (!data) return "Analiz detayı inceleniyor...";

        // Extract a meaningful summary based on type and structure
        if (analysisType === "numerology") {
            return data.overall_summary || data.genel_ozet || "Kader rakamınız ve ruhsal potansiyeliniz üzerine derinlemesine bir analiz.";
        } else if (analysisType === "birth_chart") {
            return data.overall_summary || data.genel_ozet || "Gezegenlerin konumları ve evrensel enerjinizin detaylı haritası.";
        } else if (analysisType === "tarot") {
            return data.interpretation?.overall || data.genel_yorum || "Seçilen kartların evrensel mesajı ve rehberliği.";
        } else if (analysisType === "compatibility") {
            return data.overallSummary || data.genel_uyum || "İki ruhun kozmik düzlemdeki frekans uyumu.";
        }
        return "Evrensel mesajınızı keşfedin.";
    };

    const handleCtaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        switch (analysisType) {
            case "numerology": navigate("/numerology"); break;
            case "birth_chart": navigate("/birth-chart"); break;
            case "tarot": navigate("/match"); break;
            case "compatibility": navigate("/match"); break;
            default: navigate("/insight");
        }
    };

    if (loading) {
        return (
            <Card className="glass-card border-white/5 bg-white/5 p-6 flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="glass-card border-white/5 bg-red-900/10 p-4 text-center text-white/50 text-sm">
                Bu analiz artık evrenin derinliklerinde kaybolmuş olabilir.
            </Card>
        );
    }

    const theme = getThemeColors();

    return (
        <>
            <Card
                className={`glass-card overflow-hidden border ${theme.border} bg-black/40 cursor-pointer hover:bg-black/60 transition-all group`}
                onClick={() => setShowFull(true)}
            >
                <div className={`bg-gradient-to-br ${theme.wrapper} p-5 relative overflow-hidden`}>
                    {/* Decorative glowing orb */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 blur-[40px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-black/40 rounded-xl shadow-inner backdrop-blur-md">
                                    {theme.icon}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${theme.text} leading-tight`}>{getTitle()}</h3>
                                    {ownerInfo && <p className="text-[10px] text-white/50">Gönderen: {ownerInfo.name}</p>}
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-full">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>

                        <p className="text-sm text-white/80 line-clamp-3 leading-relaxed font-medium mb-4 drop-shadow-md">
                            "{getSummaryText()}"
                        </p>

                        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs text-white/40 font-medium">Tümünü Oku</span>

                            <Button
                                size="sm"
                                className={`bg-white/10 hover:bg-white/20 text-white shadow-glow backdrop-blur-md rounded-full px-4 border ${theme.border}`}
                                onClick={handleCtaClick}
                            >
                                {theme.icon}
                                <span className="ml-2">Benim İçin de Yap</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Dialog open={showFull} onOpenChange={setShowFull}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border-white/10 text-white bg-black/95">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            {theme.icon}
                            {getTitle()}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <AnalysisDetailView result={data} analysisType={analysisType} />
                    </div>
                    <div className="mt-6 flex justify-center sticky bottom-0 py-4 bg-gradient-to-t from-black/90 to-transparent">
                        <Button size="lg" className="w-full max-w-sm bg-gradient-to-r from-primary to-accent text-white shadow-glow rounded-xl" onClick={handleCtaClick}>
                            Sen de Evrenin Sırlarını Keşfet
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
