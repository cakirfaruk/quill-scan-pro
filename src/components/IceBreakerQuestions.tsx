import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IceBreakerQuestionsProps {
  matchedUserId: string;
  onSendMessage: (message: string) => void;
}

export const IceBreakerQuestions = ({ matchedUserId, onSendMessage }: IceBreakerQuestionsProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ice_breaker_questions")
        .select("*")
        .eq("is_active", true)
        .limit(3)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Shuffle questions
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, 3));
    } catch (error) {
      console.error("Error loading ice breaker questions:", error);
      toast({
        title: "Hata",
        description: "Sorular yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [matchedUserId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Sohbet Başlatıcılar
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadQuestions}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Bu sorularla sohbete başlayabilirsiniz
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.map((q) => (
          <Button
            key={q.id}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => onSendMessage(q.question)}
          >
            {q.question}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
