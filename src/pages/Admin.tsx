import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, CreditCard, History, Loader2, Eye, Trash2, BarChart3, AlertTriangle, Activity, Bell } from "lucide-react";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { AnalyticsOverview } from "@/components/admin/AnalyticsOverview";
import { EventsChart } from "@/components/admin/EventsChart";
import { ErrorLogsList } from "@/components/admin/ErrorLogsList";
import { PerformanceMetrics } from "@/components/admin/PerformanceMetrics";
import { UserBehaviorAnalysis } from "@/components/admin/UserBehaviorAnalysis";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";
import { LiveActivityFeed } from "@/components/admin/LiveActivityFeed";
import { AlertSettings } from "@/components/admin/AlertSettings";
import { useRealtimeAnalytics } from "@/hooks/use-realtime-analytics";
import { z } from "zod";

const creditSchema = z.object({
  amount: z.number()
    .int("Kredi tam sayı olmalı")
    .positive("Kredi pozitif olmalı")
    .max(10000, "Maksimum 10000 kredi eklenebilir"),
});

interface Profile {
  id: string;
  user_id: string;
  username: string;
  credits: number;
  created_at: string;
}

interface AnalysisRecord {
  id: string;
  created_at: string;
  analysis_type: string;
  credits_used: number;
  image_data?: string;
  result?: any;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Enable real-time analytics
  useRealtimeAnalytics();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişim yetkiniz yok.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadProfiles();
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Kullanıcılar yüklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserAnalyses = async (userId: string) => {
    try {
      // Load all analysis types for the user
      const [handwriting, numerology, birthChart, compatibility, tarot, coffee, dream, palmistry, horoscope] = await Promise.all([
        supabase.from("analysis_history").select("*").eq("user_id", userId),
        supabase.from("numerology_analyses").select("*").eq("user_id", userId),
        supabase.from("birth_chart_analyses").select("*").eq("user_id", userId),
        supabase.from("compatibility_analyses").select("*").eq("user_id", userId),
        supabase.from("tarot_readings").select("*").eq("user_id", userId),
        supabase.from("coffee_fortune_readings").select("*").eq("user_id", userId),
        supabase.from("dream_interpretations").select("*").eq("user_id", userId),
        supabase.from("palmistry_readings").select("*").eq("user_id", userId),
        supabase.from("daily_horoscopes").select("*").eq("user_id", userId),
      ]);

      const allAnalyses: AnalysisRecord[] = [
        ...(handwriting.data || []),
        ...(numerology.data || []).map(item => ({ ...item, analysis_type: "numerology" })),
        ...(birthChart.data || []).map(item => ({ ...item, analysis_type: "birth_chart" })),
        ...(compatibility.data || []).map(item => ({ ...item, analysis_type: "compatibility" })),
        ...(tarot.data || []).map(item => ({ ...item, analysis_type: "tarot", result: item.interpretation })),
        ...(coffee.data || []).map(item => ({ ...item, analysis_type: "coffee_fortune", result: item.interpretation })),
        ...(dream.data || []).map(item => ({ ...item, analysis_type: "dream", result: item.interpretation })),
        ...(palmistry.data || []).map(item => ({ ...item, analysis_type: "palmistry", result: item.interpretation })),
        ...(horoscope.data || []).map(item => ({ ...item, analysis_type: "daily_horoscope", result: item.horoscope_text })),
      ];

      allAnalyses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUserAnalyses(allAnalyses);
    } catch (error: any) {
      console.error("Error loading user analyses:", error);
    }
  };

  const handleSelectUser = (profile: Profile) => {
    setSelectedUser(profile);
    loadUserAnalyses(profile.user_id);
  };

  const handleDeleteUser = async (userId: string) => {
    const username = profiles.find(p => p.user_id === userId)?.username;
    if (!confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      setIsUpdating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Oturum bulunamadı');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Kullanıcı silinemedi');
      }

      toast({
        title: "Başarılı",
        description: `${username} kullanıcısı silindi`,
      });

      if (selectedUser?.user_id === userId) {
        setSelectedUser(null);
        setUserAnalyses([]);
      }

      loadProfiles();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinemedi",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    const amount = parseInt(creditAmount);
    
    // Validate credit amount
    const validation = creditSchema.safeParse({ amount });
    if (!validation.success) {
      toast({
        title: "Geçersiz Miktar",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const newCredits = selectedUser.credits + amount;

      const { error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      // Record transaction
      await supabase.from("credit_transactions").insert({
        user_id: selectedUser.user_id,
        amount: amount,
        transaction_type: "admin_grant",
        description: `Admin tarafından eklendi: ${amount} kredi`,
      });

      toast({
        title: "Başarılı",
        description: `${amount} kredi eklendi.`,
      });

      setSelectedUser({ ...selectedUser, credits: newCredits });
      setCreditAmount("");
      loadProfiles();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Kredi eklenemedi.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    if (type === "handwriting") return "El Yazısı";
    if (type === "compatibility") return "Uyum";
    if (type === "numerology") return "Numeroloji";
    if (type === "birth_chart") return "Doğum Haritası";
    if (type === "tarot") return "Tarot";
    if (type === "coffee_fortune") return "Kahve Falı";
    if (type === "dream") return "Rüya Tabiri";
    if (type === "palmistry") return "El Okuma";
    if (type === "daily_horoscope") return "Günlük Kehanet";
    return type;
  };

  const handleViewAnalysis = (analysis: AnalysisRecord) => {
    setSelectedAnalysis(analysis);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-muted-foreground mt-1">
                  Kullanıcıları yönetin, analytics görüntüleyin ve hataları takip edin
                </p>
              </div>
            </div>
            <RealtimeIndicator />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Kullanıcılar
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Hatalar
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2">
                <Activity className="w-4 h-4" />
                Performans
              </TabsTrigger>
              <TabsTrigger value="behavior" className="gap-2">
                <Users className="w-4 h-4" />
                Davranış
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Bell className="w-4 h-4" />
                Sistem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <Card className="p-6 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Kullanıcılar</h2>
                <Badge variant="secondary" className="ml-auto">{profiles.length}</Badge>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedUser?.id === profile.id
                        ? "bg-primary/10 border-primary"
                        : "bg-card hover:bg-accent"
                    }`}
                    onClick={() => handleSelectUser(profile)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{profile.username}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString("tr-TR")}
                          </span>
                          <Badge variant="outline">{profile.credits} kredi</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(profile.user_id);
                          }}
                          className="shrink-0"
                          title="Kullanıcıyı sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* User Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedUser ? (
                <>
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold">Kredi Yönetimi</h2>
                    </div>

                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <p className="text-sm text-muted-foreground mb-1">Mevcut Kredi</p>
                      <p className="text-3xl font-bold text-primary">{selectedUser.credits}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="creditAmount">Eklenecek Kredi Miktarı</Label>
                        <Input
                          id="creditAmount"
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Örn: 100"
                          className="mt-2"
                          min="1"
                          max="10000"
                        />
                      </div>

                      <Button
                        onClick={handleAddCredits}
                        disabled={!creditAmount || isUpdating}
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ekleniyor...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Kredi Ekle
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold">Kullanıcı Geçmişi</h2>
                      <Badge variant="secondary" className="ml-auto">{userAnalyses.length}</Badge>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {userAnalyses.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Henüz analiz yapılmamış
                        </p>
                      ) : (
                        userAnalyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer group"
                            onClick={() => handleViewAnalysis(analysis)}
                          >
                            <div className="flex items-start gap-3">
                              {analysis.image_data && (
                                <img 
                                  src={analysis.image_data} 
                                  alt="Analiz görseli" 
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm">
                                    {getAnalysisTypeLabel(analysis.analysis_type)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="shrink-0">{analysis.credits_used} kredi</Badge>
                                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(analysis.created_at).toLocaleDateString("tr-TR", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Kullanıcı Seçin</h3>
                  <p className="text-muted-foreground">
                    Soldan bir kullanıcı seçerek detayları görüntüleyin
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsOverview />
          <div className="grid gap-6 lg:grid-cols-2">
            <EventsChart />
            <LiveActivityFeed />
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <ErrorLogsList />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <UserBehaviorAnalysis />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <AlertSettings />
        </TabsContent>
      </Tabs>
        )}
      </main>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAnalysis && getAnalysisTypeLabel(selectedAnalysis.analysis_type)} - Analiz Detayları
            </DialogTitle>
            <DialogDescription>
              Analiz sonuçlarınızı inceleyebilirsiniz
            </DialogDescription>
          </DialogHeader>
          {selectedAnalysis?.result && (
            <AnalysisDetailView 
              result={selectedAnalysis.result} 
              analysisType={selectedAnalysis.analysis_type}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
