import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Sparkles, Heart, Loader2, Moon, Hand, Coffee, Star, Share2, Settings, Send } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisRecord {
  id: string;
  created_at: string;
  analysis_type: string;
  selected_topics?: string[] | null;
  credits_used: number;
  result: any;
  full_name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  gender1?: string;
  gender2?: string;
}

const History = () => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [analysisToShare, setAnalysisToShare] = useState<AnalysisRecord | null>(null);
  const [visibilityType, setVisibilityType] = useState<"public" | "friends" | "specific_friends" | "friends_except">("friends");
  const [isVisible, setIsVisible] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedFriendForShare, setSelectedFriendForShare] = useState<string>("");
  const [shareNote, setShareNote] = useState("");
  const [shareType, setShareType] = useState<"message" | "feed">("message");
  const [currentUserId, setCurrentUserId] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      loadFriends(user.id);
    }
    
    loadHistory();
  };

  const loadFriends = async (userId: string) => {
    const { data: friendsData } = await supabase
      .from("friends")
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo),
        user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    setFriends(friendsData || []);
  };

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch handwriting analyses
      const { data: handwritingData, error: handwritingError } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (handwritingError) throw handwritingError;

      // Fetch numerology analyses
      const { data: numerologyData, error: numerologyError } = await supabase
        .from("numerology_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (numerologyError) throw numerologyError;

      // Fetch birth chart analyses
      const { data: birthChartData, error: birthChartError } = await supabase
        .from("birth_chart_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (birthChartError) throw birthChartError;

      // Fetch compatibility analyses
      const { data: compatibilityData, error: compatibilityError } = await supabase
        .from("compatibility_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (compatibilityError) throw compatibilityError;

      // Fetch tarot readings
      const { data: tarotData, error: tarotError } = await supabase
        .from("tarot_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tarotError) throw tarotError;

      // Fetch coffee fortune readings
      const { data: coffeeData, error: coffeeError } = await supabase
        .from("coffee_fortune_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (coffeeError) throw coffeeError;

      // Fetch dream interpretations
      const { data: dreamData, error: dreamError } = await supabase
        .from("dream_interpretations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dreamError) throw dreamError;

      // Fetch palmistry readings
      const { data: palmistryData, error: palmistryError } = await supabase
        .from("palmistry_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (palmistryError) throw palmistryError;

      // Fetch daily horoscopes
      const { data: horoscopeData, error: horoscopeError } = await supabase
        .from("daily_horoscopes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (horoscopeError) throw horoscopeError;

      // Combine all analyses into a single array
      const allAnalyses: AnalysisRecord[] = [
        ...(handwritingData || []).map(item => ({
          ...item,
          // Ensure analysis_type is "handwriting" for all handwriting analyses
          analysis_type: item.analysis_type === "full" || item.analysis_type === "selective" ? "handwriting" : item.analysis_type
        })),
        ...(numerologyData || []).map(item => ({
          ...item,
          analysis_type: "numerology"
        })),
        ...(birthChartData || []).map(item => ({
          ...item,
          analysis_type: "birth_chart"
        })),
        ...(compatibilityData || []).map(item => ({
          ...item,
          analysis_type: "compatibility"
        })),
        ...(tarotData || []).map(item => ({
          ...item,
          analysis_type: "tarot",
          result: item.interpretation
        })),
        ...(coffeeData || []).map(item => ({
          ...item,
          analysis_type: "coffee_fortune",
          result: item.interpretation
        })),
        ...(dreamData || []).map(item => ({
          ...item,
          analysis_type: "dream",
          result: item.interpretation
        })),
        ...(palmistryData || []).map(item => ({
          ...item,
          analysis_type: "palmistry",
          result: item.interpretation
        })),
        ...(horoscopeData || []).map(item => ({
          ...item,
          analysis_type: "daily_horoscope",
          result: item.horoscope_text
        })),
      ];

      // Sort by created_at descending
      allAnalyses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAnalyses(allAnalyses);
    } catch (error: any) {
      console.error("Error loading history:", error);
      toast({
        title: "Hata",
        description: "Geçmiş analizler yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    if (type === "handwriting") return "El Yazısı Analizi";
    if (type === "compatibility") return "Uyum Analizi";
    if (type === "numerology") return "Numeroloji Analizi";
    if (type === "birth_chart") return "Doğum Haritası Analizi";
    if (type === "tarot") return "Tarot Okuma";
    if (type === "coffee_fortune") return "Kahve Falı";
    if (type === "dream") return "Rüya Tabiri";
    if (type === "palmistry") return "El Okuma";
    if (type === "daily_horoscope") return "Günlük Kehanet";
    return type;
  };

  const getAnalysisIcon = (type: string) => {
    if (type === "compatibility") return Heart;
    if (type === "numerology") return Sparkles;
    if (type === "birth_chart") return Calendar;
    if (type === "tarot") return Sparkles;
    if (type === "coffee_fortune") return Coffee;
    if (type === "dream") return Moon;
    if (type === "palmistry") return Hand;
    if (type === "daily_horoscope") return Star;
    return FileText;
  };

  const handleSelectAnalysis = (id: string, checked: boolean) => {
    setSelectedAnalysisIds(prev => 
      checked ? [...prev, id] : prev.filter(aid => aid !== id)
    );
  };

  const calculateSummaryCost = () => {
    if (selectedAnalysisIds.length === 0) return 0;
    
    const selectedAnalyses = analyses.filter(a => selectedAnalysisIds.includes(a.id));
    const totalCredits = selectedAnalyses.reduce((sum, a) => sum + a.credits_used, 0);
    
    if (selectedAnalysisIds.length === 1) {
      // Tek analiz için: kredi / 3 (yukarı yuvarlama)
      return Math.ceil(totalCredits / 3);
    } else {
      // Birden fazla analiz için: (toplam kredi * analiz sayısı) / 3
      return Math.ceil((totalCredits * selectedAnalysisIds.length) / 3);
    }
  };

  const handleSummarize = async () => {
    if (selectedAnalysisIds.length === 0) {
      toast({
        title: "Analiz seçilmedi",
        description: "Lütfen özetlemek için en az bir analiz seçin.",
        variant: "destructive",
      });
      return;
    }

    setIsSummarizing(true);
    setSummaryResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-analyses', {
        body: { analysisIds: selectedAnalysisIds }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error === 'Insufficient credits') {
          toast({
            title: "Yetersiz kredi",
            description: `${data.required} kredi gerekli, ${data.available} krediniz var.`,
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      setSummaryResult(data.summary);
      toast({
        title: "Özet oluşturuldu",
        description: `${data.analysisCount} analiz özeti başarıyla oluşturuldu. ${data.creditsUsed} kredi kullanıldı.`,
      });
      
      // Reload to update credits
      await checkAuthAndLoad();
      
    } catch (error: any) {
      console.error('Summarize error:', error);
      toast({
        title: "Özet oluşturulamadı",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const renderAnalysisDetails = (analysis: AnalysisRecord) => {
    if (analysis.analysis_type === "numerology") {
      return (
        <div className="space-y-2 mb-3">
          {analysis.full_name && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Ad Soyad:</span> {analysis.full_name}
            </p>
          )}
          {analysis.birth_date && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Doğum Tarihi:</span> {new Date(analysis.birth_date).toLocaleDateString("tr-TR")}
            </p>
          )}
        </div>
      );
    }
    
    if (analysis.analysis_type === "birth_chart") {
      return (
        <div className="space-y-2 mb-3">
          {analysis.full_name && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Ad Soyad:</span> {analysis.full_name}
            </p>
          )}
          {analysis.birth_date && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Doğum:</span> {new Date(analysis.birth_date).toLocaleDateString("tr-TR")} {analysis.birth_time}
            </p>
          )}
          {analysis.birth_place && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Yer:</span> {analysis.birth_place}
            </p>
          )}
        </div>
      );
    }
    
    if (analysis.analysis_type === "compatibility") {
      return (
        <div className="space-y-2 mb-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">İki kişi arası uyum analizi</span>
          </p>
          {analysis.result?.analysisTypes && (
            <div className="flex flex-wrap gap-1">
              {analysis.result.analysisTypes.map((type: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {type === "handwriting" ? "El Yazısı" : type === "numerology" ? "Numeroloji" : "Doğum Haritası"}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  const openShareDialog = async (analysis: AnalysisRecord) => {
    setAnalysisToShare(analysis);
    setShareDialogOpen(true);
    setShareNote("");
    setSelectedFriendForShare("");
    setShareType("message");
  };

  const openVisibilityDialog = async (analysis: AnalysisRecord) => {
    setAnalysisToShare(analysis);
    setVisibilityDialogOpen(true);
    
    // Load existing sharing settings
    const { data: existingShare } = await supabase
      .from("shared_analyses")
      .select("*")
      .eq("analysis_id", analysis.id)
      .eq("analysis_type", analysis.analysis_type)
      .maybeSingle();

    if (existingShare) {
      const vt = existingShare.visibility_type as "public" | "friends" | "specific_friends" | "friends_except";
      setVisibilityType(vt || "friends");
      setIsVisible(existingShare.is_visible ?? true);
      setSelectedFriendIds(existingShare.allowed_user_ids || []);
    } else {
      setVisibilityType("friends");
      setIsVisible(true);
      setSelectedFriendIds([]);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleShareAnalysis = async () => {
    if (!analysisToShare) return;

    try {
      if (shareType === "message") {
        // Share as message to friend
        if (!selectedFriendForShare) {
          toast({
            title: "Hata",
            description: "Lütfen bir arkadaş seçin.",
            variant: "destructive",
          });
          return;
        }

        const messageContent = `📊 ${getAnalysisTypeLabel(analysisToShare.analysis_type)} sonucumu paylaştım!\n\n${shareNote || "Analiz sonucumu görmek için tıkla."}\n\n[Analiz ID: ${analysisToShare.id}]`;

        const { error } = await supabase
          .from("messages")
          .insert({
            sender_id: currentUserId,
            receiver_id: selectedFriendForShare,
            content: messageContent,
          });

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Analiz arkadaşınıza gönderildi.",
        });
      } else {
        // Share to feed (will be implemented with feed feature)
        toast({
          title: "Bilgi",
          description: "Profil akışı özelliği yakında eklenecek.",
        });
      }

      setShareDialogOpen(false);
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "Hata",
        description: "Paylaşım yapılamadı.",
        variant: "destructive",
      });
    }
  };

  const handleVisibilitySettings = async () => {
    if (!analysisToShare) return;

    try {
      const { data: existingShare } = await supabase
        .from("shared_analyses")
        .select("id")
        .eq("analysis_id", analysisToShare.id)
        .eq("analysis_type", analysisToShare.analysis_type)
        .maybeSingle();

      const shareData = {
        user_id: currentUserId,
        analysis_id: analysisToShare.id,
        analysis_type: analysisToShare.analysis_type,
        visibility_type: visibilityType,
        is_visible: isVisible,
        is_public: visibilityType === "public",
        allowed_user_ids: visibilityType === "specific_friends" ? selectedFriendIds : null,
        blocked_user_ids: visibilityType === "friends_except" ? selectedFriendIds : null,
      };

      if (existingShare) {
        const { error } = await supabase
          .from("shared_analyses")
          .update(shareData)
          .eq("id", existingShare.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shared_analyses")
          .insert(shareData);

        if (error) throw error;
      }

      toast({
        title: "Başarılı",
        description: "Görünürlük ayarları güncellendi.",
      });

      setVisibilityDialogOpen(false);
    } catch (error: any) {
      console.error("Visibility error:", error);
      toast({
        title: "Hata",
        description: "Görünürlük ayarları güncellenemedi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Analizlerim
            </h1>
            <p className="text-muted-foreground">
              Tüm analiz sonuçlarınızı burada görüntüleyebilirsiniz
            </p>
          </div>
          {analyses.length > 0 && (
            <div className="flex items-center gap-3">
              {selectedAnalysisIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {calculateSummaryCost()} kredi harcanacak
                </span>
              )}
              <Button 
                onClick={handleSummarize}
                disabled={selectedAnalysisIds.length === 0 || isSummarizing}
                variant="default"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Özetleniyor...
                  </>
                ) : (
                  `Özetle (${selectedAnalysisIds.length})`
                )}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : analyses.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Henüz analiz yok</h3>
            <p className="text-muted-foreground mb-6">
              İlk analizinizi yapmak için ana sayfaya gidin
            </p>
            <Button onClick={() => navigate("/")}>Analiz Yap</Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => {
              const Icon = getAnalysisIcon(analysis.analysis_type);
              const isSelected = selectedAnalysisIds.includes(analysis.id);
              return (
                <Card
                  key={analysis.id}
                  className={`p-6 hover:shadow-elegant transition-all group ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectAnalysis(analysis.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary">{analysis.credits_used} Kredi</Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2">
                        {getAnalysisTypeLabel(analysis.analysis_type)}
                      </h3>

                      {renderAnalysisDetails(analysis)}

                      {analysis.selected_topics && analysis.selected_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {analysis.selected_topics.slice(0, 3).map((topic, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {analysis.selected_topics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{analysis.selected_topics.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openShareDialog(analysis);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Paylaş
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openVisibilityDialog(analysis);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Analizi Paylaş</DialogTitle>
              <DialogDescription>
                {analysisToShare && getAnalysisTypeLabel(analysisToShare.analysis_type)} sonucunuzu paylaşın
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Paylaşım Türü</Label>
                <Select value={shareType} onValueChange={(value: any) => setShareType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Arkadaşa Mesaj Gönder</SelectItem>
                    <SelectItem value="feed">Profil Akışına Paylaş</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shareType === "message" && (
                <div>
                  <Label>Arkadaş Seç</Label>
                  <Select value={selectedFriendForShare} onValueChange={setSelectedFriendForShare}>
                    <SelectTrigger>
                      <SelectValue placeholder="Arkadaş seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {friends.length === 0 ? (
                        <SelectItem value="none" disabled>Henüz arkadaşınız yok</SelectItem>
                      ) : (
                        friends.map((friend) => {
                          const friendProfile = friend.user_id === currentUserId 
                            ? friend.friend_profile 
                            : friend.user_profile;
                          const friendId = friendProfile?.user_id;
                          
                          if (!friendId) return null;
                          
                          return (
                            <SelectItem key={friend.id} value={friendId}>
                              {friendProfile?.full_name || friendProfile?.username || "Arkadaş"}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Not Ekle (İsteğe Bağlı)</Label>
                <Textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Paylaşırken bir not ekleyebilirsiniz..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleShareAnalysis}
                className="w-full"
                disabled={shareType === "message" && !selectedFriendForShare}
              >
                <Send className="w-4 h-4 mr-2" />
                Paylaş
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Visibility Settings Dialog */}
        <Dialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Görünürlük Ayarları</DialogTitle>
              <DialogDescription>
                Bu analizin kimler tarafından görülebileceğini ayarlayın
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Görünür</Label>
                <Switch
                  id="visible"
                  checked={isVisible}
                  onCheckedChange={setIsVisible}
                />
              </div>

              <div>
                <Label>Görünürlük</Label>
                <Select value={visibilityType} onValueChange={(value: any) => setVisibilityType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Herkes</SelectItem>
                    <SelectItem value="friends">Tüm Arkadaşlarım</SelectItem>
                    <SelectItem value="specific_friends">Sadece Seçtiklerim</SelectItem>
                    <SelectItem value="friends_except">Seçtiklerim Hariç</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(visibilityType === "specific_friends" || visibilityType === "friends_except") && (
                <div>
                  <Label>
                    {visibilityType === "specific_friends" ? "Paylaşılacak Arkadaşlar" : "Hariç Tutulacak Arkadaşlar"}
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {friends.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz arkadaşınız yok
                      </p>
                    ) : (
                      friends.map((friend) => {
                        const friendProfile = friend.user_id === currentUserId 
                          ? friend.friend_profile 
                          : friend.user_profile;
                        const friendId = friendProfile?.user_id;
                        
                        if (!friendId) return null;
                        
                        return (
                          <div key={friend.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`friend-${friend.id}`}
                              checked={selectedFriendIds.includes(friendId)}
                              onCheckedChange={() => toggleFriendSelection(friendId)}
                            />
                            <label
                              htmlFor={`friend-${friend.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {friendProfile?.full_name || friendProfile?.username || "Arkadaş"}
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleVisibilitySettings}
                className="w-full"
                disabled={(visibilityType === "specific_friends" || visibilityType === "friends_except") && selectedFriendIds.length === 0}
              >
                <Settings className="w-4 h-4 mr-2" />
                Ayarları Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Analysis Detail Dialog */}
        {selectedAnalysis && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnalysis(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnalysis.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                  Kapat
                </Button>
              </div>

              {selectedAnalysis.result && typeof selectedAnalysis.result === "object" && (
                <AnalysisDetailView 
                  result={selectedAnalysis.result} 
                  analysisType={selectedAnalysis.analysis_type} 
                />
              )}
            </Card>
          </div>
        )}

        {/* Summary Dialog */}
        <Dialog open={!!summaryResult} onOpenChange={() => setSummaryResult(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analiz Özeti</DialogTitle>
              <DialogDescription>
                {selectedAnalysisIds.length} analiz özeti
              </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground">{summaryResult}</p>
            </div>
            <Button onClick={() => {
              setSummaryResult(null);
              setSelectedAnalysisIds([]);
            }}>
              Kapat
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default History;