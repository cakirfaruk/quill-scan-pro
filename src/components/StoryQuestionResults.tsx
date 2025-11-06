import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface StoryQuestionResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  question: string;
}

interface Answer {
  id: string;
  user_id: string;
  answer: string;
  created_at: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

export const StoryQuestionResults = ({
  open,
  onOpenChange,
  questionId,
  question,
}: StoryQuestionResultsProps) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && questionId) {
      loadAnswers();
    }
  }, [open, questionId]);

  const loadAnswers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("story_question_answers" as any)
        .select(`
          id,
          user_id,
          answer,
          created_at,
          profiles!story_question_answers_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("question_id", questionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match our Answer interface
      const transformedAnswers = (data || []).map((answer: any) => ({
        id: answer.id,
        user_id: answer.user_id,
        answer: answer.answer,
        created_at: answer.created_at,
        profile: {
          username: answer.profiles?.username || "Unknown",
          full_name: answer.profiles?.full_name,
          profile_photo: answer.profiles?.profile_photo,
        },
      }));

      setAnswers(transformedAnswers);
    } catch (error) {
      console.error("Error loading question answers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Soru Yanıtları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-2">{question}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {answers.length} yanıt
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Yükleniyor...
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={answer.profile.profile_photo || undefined} />
                        <AvatarFallback className="text-xs">
                          {answer.profile.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {answer.profile.full_name || answer.profile.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(answer.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{answer.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {answers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Henüz yanıt verilmedi</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
