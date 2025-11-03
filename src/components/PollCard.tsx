import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollCardProps {
  pollId: string;
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  expiresAt: string;
  createdBy: string;
  currentUserId: string;
}

export const PollCard = ({
  pollId,
  question,
  options: initialOptions,
  multipleChoice,
  expiresAt,
  createdBy,
  currentUserId,
}: PollCardProps) => {
  const [options, setOptions] = useState(initialOptions);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfVoted();
    loadVotes();
  }, [pollId]);

  const checkIfVoted = async () => {
    const { data } = await supabase
      .from("poll_votes")
      .select("option_ids")
      .eq("poll_id", pollId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (data) {
      setHasVoted(true);
      setSelectedOptions(data.option_ids);
    }
  };

  const loadVotes = async () => {
    const { data } = await supabase
      .from("poll_votes")
      .select("option_ids")
      .eq("poll_id", pollId);

    if (data) {
      const voteCounts: { [key: string]: number } = {};
      data.forEach((vote) => {
        vote.option_ids.forEach((optionId: string) => {
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
        });
      });

      setOptions((prev) =>
        prev.map((opt) => ({
          ...opt,
          votes: voteCounts[opt.id] || 0,
        }))
      );
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Seçim Yapın",
        description: "Lütfen en az bir seçenek seçin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVoting(true);

      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        user_id: currentUserId,
        option_ids: selectedOptions,
      });

      if (error) throw error;

      setHasVoted(true);
      loadVotes();

      toast({
        title: "Oyunuz Alındı",
        description: "Teşekkürler!",
      });
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "Hata",
        description: "Oy kullanılamadı.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const toggleOption = (optionId: string) => {
    if (hasVoted) return;

    if (multipleChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
  const isExpired = new Date(expiresAt) < new Date();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{question}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {isExpired
              ? "Sona erdi"
              : `${formatDistanceToNow(new Date(expiresAt), {
                  addSuffix: true,
                  locale: tr,
                })} bitiyor`}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.id);

          return (
            <div key={option.id}>
              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-between mb-2"
                onClick={() => toggleOption(option.id)}
                disabled={hasVoted || isExpired}
              >
                <span className="flex items-center gap-2">
                  {hasVoted && isSelected && <CheckCircle2 className="w-4 h-4" />}
                  {option.text}
                </span>
                {hasVoted && <span className="font-semibold">{option.votes}</span>}
              </Button>
              {hasVoted && (
                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    %{percentage.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasVoted && !isExpired && (
        <Button onClick={handleVote} disabled={isVoting} className="w-full">
          {isVoting ? "Gönderiliyor..." : "Oy Ver"}
        </Button>
      )}

      {hasVoted && (
        <p className="text-sm text-center text-muted-foreground">
          Toplam {totalVotes} oy
        </p>
      )}
    </Card>
  );
};