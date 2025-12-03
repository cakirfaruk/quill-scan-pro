import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Moon, Brain, History, Star, TrendingUp, Clock, ChevronRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentAnalysis {
  id: string;
  analysis_type: string;
  created_at: string;
}

const Discovery = () => {
  const navigate = useNavigate();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [popularAnalyses, setPopularAnalyses] = useState<{ type: string; count: number }[]>([]);
  const [dailyTip, setDailyTip] = useState("");
  const [loading, setLoading] = useState(true);

  const analyses = [
    { title: "El Yazısı Analizi", icon: "✍️", color: "from-blue-500 to-cyan-500", path: "/handwriting", type: "handwriting" },
    { title: "Numeroloji", icon: "🔢", color: "from-purple-500 to-pink-500", path: "/numerology", type: "numerology" },
    { title: "Doğum Haritası", icon: "🌟", color: "from-amber-500 to-orange-500", path: "/birth-chart", type: "birth_chart" },
    { title: "Uyumluluk", icon: "💕", color: "from-rose-500 to-red-500", path: "/compatibility", type: "compatibility" },
  ];

  const fortunes = [
    { title: "Tarot", icon: "🔮", color: "from-violet-500 to-purple-500", path: "/tarot", type: "tarot" },
    { title: "Kahve Falı", icon: "☕", color: "from-amber-600 to-yellow-600", path: "/coffee-fortune", type: "coffee_fortune" },
    { title: "Rüya Tabiri", icon: "🌙", color: "from-indigo-500 to-blue-500", path: "/dream", type: "dream" },
    { title: "Günlük Burç", icon: "⭐", color: "from-yellow-500 to-amber-500", path: "/daily-horoscope", type: "daily_horoscope" },
    { title: "El Okuma", icon: "🤲", color: "from-teal-500 to-emerald-500", path: "/palmistry", type: "palmistry" },
  ];

  const dailyTips = [
    "Bugün iç sesinizi dinleyin, önemli kararlar için ideal bir gün.",
    "Evren size yeni fırsatlar sunuyor, gözlerinizi açık tutun.",
    "Geçmişteki deneyimleriniz bugünkü bilgeliğinizin temelidir.",
    "Bugün meditasyon ve içe dönüş için mükemmel bir zaman.",
    "Yıldızlar yaratıcılığınızı destekliyor, sanatsal projelere başlayın.",
    "İlişkilerinize özen gösterin, sevdiklerinizle kaliteli vakit geçirin.",
    "Maddi konularda temkinli davranın, büyük harcamalardan kaçının.",
  ];

  useEffect(() => {
    loadData();
    // Set daily tip based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyTip(dailyTips[dayOfYear % dailyTips.length]);
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load recent analyses for current user
        const { data: recent } = await supabase
          .from("analysis_history")
          .select("id, analysis_type, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (recent) setRecentAnalyses(recent);
      }

      // Load popular analyses (count by type)
      const { data: historyData } = await supabase
        .from("analysis_history")
        .select("analysis_type");

      if (historyData) {
        const counts: Record<string, number> = {};
        historyData.forEach(h => {
          counts[h.analysis_type] = (counts[h.analysis_type] || 0) + 1;
        });
        
        const sorted = Object.entries(counts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
        
        setPopularAnalyses(sorted);
      }
    } catch (error) {
      console.error("Error loading discovery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisInfo = (type: string) => {
    const all = [...analyses, ...fortunes];
    return all.find(a => a.type === type);
  };

  const formatAnalysisType = (type: string) => {
    const info = getAnalysisInfo(type);
    return info?.title || type;
  };

  return (
    <div className="page-container-mobile bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-4 max-w-6xl space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-primary rounded-full mb-3 shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Keşfet
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Analizler ve fallarla kendinizi keşfedin
          </p>
        </motion.div>

        {/* Mystic Oracle Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card 
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 cursor-pointer hover:shadow-glow transition-all hover:-translate-y-1"
            onClick={() => navigate("/oracle")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Mystic Oracle
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Kişisel astroloji asistanına sor, yıldızların bilgeliğini keşfet
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Tip Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Günün Mesajı</p>
                  <p className="text-sm font-medium">{dailyTip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Son Analizlerim</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate("/analysis-history")}
              >
                Tümü <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {recentAnalyses.map((analysis) => {
                const info = getAnalysisInfo(analysis.analysis_type);
                return (
                  <Card 
                    key={analysis.id}
                    className="flex-shrink-0 w-28 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate("/analysis-history")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${info?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-xl mb-2`}>
                        {info?.icon || "📊"}
                      </div>
                      <p className="text-xs font-medium truncate">{info?.title || analysis.analysis_type}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Popular Analyses */}
        {popularAnalyses.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Popüler Analizler</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {popularAnalyses.map((item, idx) => {
                const info = getAnalysisInfo(item.type);
                return (
                  <Card 
                    key={item.type}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => info && navigate(info.path)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{info?.title || item.type}</p>
                        <p className="text-xs text-muted-foreground">{item.count} analiz</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Analyses Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Analizler</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {analyses.map((item) => (
              <Card 
                key={item.path}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-md`}>
                    {item.icon}
                  </div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Fortunes Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Fallar</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {fortunes.map((item) => (
              <Card 
                key={item.path}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform shadow-md`}>
                    {item.icon}
                  </div>
                  <p className="font-medium text-xs group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Analysis History Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pb-20"
        >
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/analysis-history")}
          >
            <History className="w-5 h-5" />
            Tüm Analiz Geçmişim
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Discovery;
