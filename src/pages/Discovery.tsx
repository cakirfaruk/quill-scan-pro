import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Moon, Brain, Star, Coffee, Hand, Sun, Activity, Zap, TrendingUp, Users, Heart } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PageHeader } from "@/components/ui/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { getOptimizedImageUrl } from "@/utils/image-optimizer";
import { useAuth } from "@/contexts/AuthContext";

const Discovery = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    credits: 0,
    analysesCompleted: 0,
    matches: 0,
    astralEnergy: 85
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // Use profile from context for credits, fetch only counts in parallel
    const userId = user.id;
    Promise.all([
      supabase.from("analysis_history").select("id", { count: 'exact', head: true }).eq("user_id", userId),
      supabase.from("matches").select("id", { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    ]).then(([analysesResult, matchesResult]) => {
      setStats({
        credits: authProfile?.credits || 0,
        analysesCompleted: analysesResult.count || 0,
        matches: matchesResult.count || 0,
        astralEnergy: Math.floor(Math.random() * 30) + 70,
      });
    }).finally(() => setLoading(false));
  }, [user, authProfile]);

  const quickTools = [
    { id: "horoscope", icon: Sun, label: "Gunluk Burc", path: "/daily-horoscope", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    { id: "tarot", icon: Moon, label: "Tarot Okuma", path: "/tarot", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
    { id: "dream", icon: Sparkles, label: "Ruya Tabiri", path: "/dream", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
    { id: "compatibility", icon: Heart, label: "Uyum Analizi", path: "/compatibility", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  ];

  const deepTools = [
    { id: "birth-chart", icon: Star, label: "Dogum Haritasi", path: "/birth-chart", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", desc: "Astrolojik potansiyelini kesfet" },
    { id: "numerology", icon: Brain, label: "Numeroloji", path: "/numerology", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", desc: "Kader sayilarinin sifresini coz" },
    { id: "coffee", icon: Coffee, label: "Kahve Fali", path: "/coffee-fortune", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", desc: "Telvelerdeki gizemi oku" },
    { id: "palm", icon: Hand, label: "El Fali", path: "/palmistry", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", desc: "Kader cizgilerini ogren" },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-32 overflow-hidden relative">
      {/* Static background — no blur, no animations */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/3" />
      </div>

      <PageHeader
        title="Insight Command Center"
        description="Kozmik veri analiz merkeziniz"
      />

      <main className="container mx-auto px-4 relative z-10 py-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Main User Telemetry Widget */}
          <ScrollReveal direction="up" delay={0.1} className="md:col-span-8">
            <Card className="glass-card border-white/10 rounded-3xl p-6 h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary via-secondary to-accent relative shrink-0">
                  <div className="absolute inset-0 rounded-full animate-spin-slow bg-gradient-to-tr from-primary/50 to-transparent blur-md" />
                  <img src={authProfile?.profile_photo ? getOptimizedImageUrl(authProfile.profile_photo, 200, 200) : "/placeholder.svg"} className="w-full h-full rounded-full object-cover border-4 border-black box-border relative z-10" alt="Avatar" />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-black neon-text mb-1 tracking-tight">Kozmik Durum</h2>
                  <p className="text-white/60 mb-6 font-medium tracking-wide text-sm">Sistem aktif. Frekanslar senkronize.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 bg-black/30">
                      <Zap className="w-5 h-5 text-accent mb-2" />
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Enerji</p>
                      <p className="text-xl font-bold text-white">%{stats.astralEnergy}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 bg-black/30">
                      <Star className="w-5 h-5 text-primary mb-2" />
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Kredi</p>
                      <p className="text-xl font-bold text-white">{stats.credits}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 bg-black/30">
                      <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Analiz</p>
                      <p className="text-xl font-bold text-white">{stats.analysesCompleted}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 bg-black/30">
                      <Users className="w-5 h-5 text-rose-400 mb-2" />
                      <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Bag</p>
                      <p className="text-xl font-bold text-white">{stats.matches}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollReveal>

          {/* Quick Tools Widget */}
          <ScrollReveal direction="up" delay={0.2} className="md:col-span-4">
            <Card className="glass-card border-white/10 rounded-3xl p-6 h-full">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Hizli Erisim
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickTools.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => navigate(tool.path)}
                    className={`cursor-pointer group flex flex-col items-center justify-center p-4 rounded-2xl border ${tool.border} ${tool.bg} bg-black/30 hover:bg-white/10 transition-all duration-300`}
                  >
                    <tool.icon className={`w-8 h-8 mb-2 ${tool.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-bold text-white/80 text-center">{tool.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>

          {/* Deep Analysis Matrix */}
          <ScrollReveal direction="up" delay={0.3} className="md:col-span-12">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-accent" />
              Derin Analiz Matrisi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {deepTools.map((tool, index) => (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.path)}
                  className={`cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 bg-black/40 p-6 shadow-glass hover:shadow-neon transition-all duration-500 h-full hover:-translate-y-[5px]`}
                >
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-current ${tool.color}`} />

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${tool.border} ${tool.bg}`}>
                    <tool.icon className={`w-7 h-7 ${tool.color}`} />
                  </div>

                  <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors mb-2">
                    {tool.label}
                  </h4>
                  <p className="text-sm font-medium text-white/50 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Aesthetic Chart Placeholder (Future integration) */}
          <ScrollReveal direction="up" delay={0.4} className="md:col-span-12">
            <Card className="glass-card border-white/10 rounded-3xl p-6 h-64 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-neon-gradient opacity-5 opacity-0 group-hover:opacity-5 transition-opacity duration-1000" />
              <Brain className="w-12 h-12 text-primary/30 mb-4 animate-pulse" />
              <h4 className="text-white/50 font-bold uppercase tracking-widest text-sm mb-2">Bilissel Uyum Haritasi</h4>
              <p className="text-white/30 text-xs text-center max-w-xs">Gelismis analitik grafik motoru senkronize ediliyor. Veriler yakinda kullanilabilir olacak.</p>

              {/* Decorative Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
            </Card>
          </ScrollReveal>

        </div>
      </main>
    </div>
  );
};

export default Discovery;
