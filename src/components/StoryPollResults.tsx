import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StoryPollResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  question: string;
  options: Array<{ id: number; text: string }>;
}

interface Vote {
  user_id: string;
  option_ids: number[];
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
}

export const StoryPollResults = ({
  open,
  onOpenChange,
  pollId,
  question,
  options,
}: StoryPollResultsProps) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && pollId) {
      loadVotes();
    }
  }, [open, pollId]);

  const loadVotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("story_poll_votes" as any)
        .select(`
          user_id,
          option_ids,
          profiles!story_poll_votes_user_id_fkey (
            username,
            full_name,
            profile_photo
          )
        `)
        .eq("poll_id", pollId);

      if (error) throw error;

      // Transform data to match our Vote interface
      const transformedVotes = (data || []).map((vote: any) => ({
        user_id: vote.user_id,
        option_ids: vote.option_ids,
        profile: {
          username: vote.profiles?.username || "Unknown",
          full_name: vote.profiles?.full_name,
          profile_photo: vote.profiles?.profile_photo,
        },
      }));

      setVotes(transformedVotes);
    } catch (error) {
      console.error("Error loading poll votes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionVotes = (optionId: number) => {
    return votes.filter((vote) => vote.option_ids.includes(optionId));
  };

  const totalVotes = votes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Anket Sonuçları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-2">{question}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalVotes} kişi oy verdi
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Yükleniyor...
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {options.map((option) => {
                  const optionVotes = getOptionVotes(option.id);
                  const percentage = totalVotes > 0 ? (optionVotes.length / totalVotes) * 100 : 0;

                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{option.text}</p>
                        <span className="text-xs text-muted-foreground">
                          {optionVotes.length} oy ({percentage.toFixed(0)}%)
                        </span>
                      </div>

                      <Progress value={percentage} className="h-2" />

                      {optionVotes.length > 0 && (
                        <div className="ml-2 space-y-1">
                          {optionVotes.map((vote) => (
                            <div
                              key={vote.user_id}
                              className="flex items-center gap-2 py-1"
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={vote.profile.profile_photo || undefined} />
                                <AvatarFallback className="text-xs">
                                  {vote.profile.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">
                                {vote.profile.full_name || vote.profile.username}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {totalVotes === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Henüz oy verilmedi</p>
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
