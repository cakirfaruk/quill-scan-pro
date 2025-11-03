import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🎉"];

export const MessageReactions = ({ messageId, currentUserId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReactions();

    // Subscribe to reactions changes
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("id, emoji, user_id")
        .eq("message_id", messageId);

      if (error) throw error;

      // Group reactions by emoji
      const grouped = data?.reduce((acc, reaction) => {
        const existing = acc.find((r) => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user_id);
        } else {
          acc.push({
            id: reaction.id,
            emoji: reaction.emoji,
            user_id: reaction.user_id,
            count: 1,
            users: [reaction.user_id],
          });
        }
        return acc;
      }, [] as Reaction[]) || [];

      setReactions(grouped);
    } catch (error: any) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      const existingReaction = reactions.find(
        (r) => r.emoji === emoji && r.users.includes(currentUserId)
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", currentUserId)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji: emoji,
          });

        if (error) throw error;
      }

      setShowPicker(false);
    } catch (error: any) {
      console.error("Error handling reaction:", error);
      toast({
        title: "Hata",
        description: "Tepki eklenemedi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map((reaction) => {
        const userReacted = reaction.users.includes(currentUserId);
        return (
          <Button
            key={reaction.emoji}
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${
              userReacted
                ? "bg-primary/20 hover:bg-primary/30"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={() => handleReaction(reaction.emoji)}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span className="text-[10px]">{reaction.count}</span>
          </Button>
        );
      })}

      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
          >
            <SmilePlus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
