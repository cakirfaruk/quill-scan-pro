import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Clock, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface GroupPollCardProps {
  poll: {
    id: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    multiple_choice: boolean;
    expires_at: string;
    created_at: string;
    created_by: string;
  };
  currentUserId: string;
  isAdmin: boolean;
  onDelete?: () => void;
}

export const GroupPollCard = ({ poll, currentUserId, isAdmin, onDelete }: GroupPollCardProps) => {
  const { toast } = useToast();
  const [votes, setVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isExpired = new Date(poll.expires_at) < new Date();

  useEffect(() => {
    loadVotes();
  }, [poll.id]);

  const loadVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("group_poll_votes")
        .select("*")
        .eq("poll_id", poll.id);

      if (error) throw error;

      setVotes(data || []);

      // Check if current user has voted
      const myVote = (data || []).find((v: any) => v.user_id === currentUserId);
      if (myVote) {
        setUserVote(myVote.option_ids);
        setSelectedOptions(myVote.option_ids);
      }
    } catch (error: any) {
      console.error("Error loading votes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir seçenek seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      setVoting(true);

      if (userVote.length > 0) {
        // Update existing vote
        const { error } = await supabase
          .from("group_poll_votes")
          .update({ option_ids: selectedOptions })
          .eq("poll_id", poll.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from("group_poll_votes")
          .insert({
            poll_id: poll.id,
            user_id: currentUserId,
            option_ids: selectedOptions,
          });

        if (error) throw error;
      }

      toast({
        title: "Başarılı",
        description: "Oyunuz kaydedildi",
      });

      await loadVotes();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Oy kullanılamadı",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  const handleDeletePoll = async () => {
    if (!confirm("Anketi silmek istediğinizden emin misiniz?")) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("group_polls")
        .delete()
        .eq("id", poll.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Anket silindi",
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Anket silinemedi",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getVoteCount = (optionId: string) => {
    return votes.filter((v) => v.option_ids.includes(optionId)).length;
  };

  const totalVotes = votes.length;

  const getVotePercentage = (optionId: string) => {
    if (totalVotes === 0) return 0;
    return Math.round((getVoteCount(optionId) / totalVotes) * 100);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <BarChart3 className="w-5 h-5" />
          <span className="font-semibold">Anket</span>
        </div>
        {isAdmin && poll.created_by === currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeletePoll}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </Button>
        )}
      </div>

      <h3 className="font-medium mb-4">{poll.question}</h3>

      {userVote.length === 0 && !isExpired ? (
        // Voting interface
        <div className="space-y-3 mb-4">
          {poll.multiple_choice ? (
            // Multiple choice
            <div className="space-y-2">
              {poll.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedOptions([...selectedOptions, option.id]);
                      } else {
                        setSelectedOptions(
                          selectedOptions.filter((id) => id !== option.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            // Single choice
            <RadioGroup
              value={selectedOptions[0] || ""}
              onValueChange={(value) => setSelectedOptions([value])}
            >
              {poll.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      ) : (
        // Results view
        <div className="space-y-3 mb-4">
          {poll.options.map((option) => {
            const voteCount = getVoteCount(option.id);
            const percentage = getVotePercentage(option.id);
            const isUserChoice = userVote.includes(option.id);

            return (
              <div key={option.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isUserChoice ? "font-semibold" : ""}`}>
                    {option.text}
                    {isUserChoice && " ✓"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {voteCount} oy ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      )}

      {userVote.length === 0 && !isExpired && (
        <Button
          onClick={handleVote}
          disabled={voting || selectedOptions.length === 0}
          className="w-full"
        >
          {voting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Oy Ver"
          )}
        </Button>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
        <span>{totalVotes} oy</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {isExpired ? (
            <span>Sona erdi</span>
          ) : (
            <span>
              {formatDistanceToNow(new Date(poll.expires_at), {
                addSuffix: true,
                locale: tr,
              })}{" "}
              bitiyor
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
