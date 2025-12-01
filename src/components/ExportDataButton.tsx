import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2 } from "lucide-react";

export const ExportDataButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Kullanıcı oturumu bulunamadı");
      }

      // Fetch all user data
      const [
        { data: profile },
        { data: posts },
        { data: comments },
        { data: likes },
        { data: friends },
        { data: messages },
        { data: birthChartAnalyses },
        { data: numerologyAnalyses },
        { data: tarotReadings },
        { data: palmistryReadings },
        { data: coffeeReadings },
        { data: dreamInterpretations },
        { data: compatibilityAnalyses },
        { data: dailyHoroscopes },
        { data: analysisHistory },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('posts').select('*').eq('user_id', user.id),
        supabase.from('post_comments').select('*').eq('user_id', user.id),
        supabase.from('post_likes').select('*').eq('user_id', user.id),
        supabase.from('friends').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('birth_chart_analyses').select('*').eq('user_id', user.id),
        supabase.from('numerology_analyses').select('*').eq('user_id', user.id),
        supabase.from('analysis_history').select('*').eq('user_id', user.id).eq('analysis_type', 'tarot'),
        supabase.from('palmistry_readings').select('*').eq('user_id', user.id),
        supabase.from('coffee_fortune_readings').select('*').eq('user_id', user.id),
        supabase.from('dream_interpretations').select('*').eq('user_id', user.id),
        supabase.from('compatibility_analyses').select('*').eq('user_id', user.id),
        supabase.from('daily_horoscopes').select('*').eq('user_id', user.id),
        supabase.from('analysis_history').select('*').eq('user_id', user.id),
      ]);

      // Compile all data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        profile,
        posts: posts || [],
        comments: comments || [],
        likes: likes || [],
        friends: friends || [],
        messages: messages || [],
        analyses: {
          birthChart: birthChartAnalyses || [],
          numerology: numerologyAnalyses || [],
          tarot: tarotReadings || [],
          palmistry: palmistryReadings || [],
          coffeeFortune: coffeeReadings || [],
          dreamInterpretation: dreamInterpretations || [],
          compatibility: compatibilityAnalyses || [],
          dailyHoroscope: dailyHoroscopes || [],
          history: analysisHistory || [],
        },
      };

      // Create JSON file and download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stellara-verilerim-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Veriler indirildi",
        description: "Tüm verileriniz JSON formatında indirildi.",
      });
    } catch (error: any) {
      console.error("Export data error:", error);
      toast({
        title: "İndirme hatası",
        description: error.message || "Veriler indirilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="w-full"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          İndiriliyor...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Verilerimi İndir (JSON)
        </>
      )}
    </Button>
  );
};
