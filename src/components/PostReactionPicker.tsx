import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Smile, Laugh, Frown, ThumbsUp, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Reaction {
  type: string;
  count: number;
  hasReacted: boolean;
}

interface PostReactionPickerProps {
  postId: string;
  currentUserId: string;
  onReactionChange?: () => void;
}

const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Beğen", color: "text-blue-500" },
  { type: "love", icon: Heart, label: "Sevdim", color: "text-red-500" },
  { type: "haha", icon: Laugh, label: "Komik", color: "text-yellow-500" },
  { type: "wow", icon: Star, label: "Vay", color: "text-purple-500" },
  { type: "sad", icon: Frown, label: "Üzgün", color: "text-gray-500" },
  { type: "smile", icon: Smile, label: "Gülücük", color: "text-green-500" },
];

export const PostReactionPicker = ({ postId, currentUserId, onReactionChange }: PostReactionPickerProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`post_reactions_${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("reaction_type, user_id")
        .eq("post_id", postId);

      if (error) throw error;

      // Group reactions by type
      const grouped = REACTIONS.map(r => {
        const reactionData = data?.filter(d => d.reaction_type === r.type) || [];
        return {
          type: r.type,
          count: reactionData.length,
          hasReacted: reactionData.some(d => d.user_id === currentUserId),
        };
      }).filter(r => r.count > 0);

      setReactions(grouped);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const existingReaction = reactions.find(r => r.hasReacted);

      if (existingReaction?.type === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Remove existing reaction if any
        if (existingReaction) {
          await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", currentUserId);
        }

        // Add new reaction
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: currentUserId,
            reaction_type: reactionType,
          });

        if (error) throw error;
      }

      onReactionChange?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast({
        title: "Hata",
        description: "Reaksiyon eklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const userReaction = reactions.find(r => r.hasReacted);
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="flex items-center gap-2">
      {/* Quick reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 transition-colors",
              userReaction && "text-primary"
            )}
          >
            {userReaction ? (
              <>
                {REACTIONS.find(r => r.type === userReaction.type)?.icon && (
                  <span className={REACTIONS.find(r => r.type === userReaction.type)?.color}>
                    {(() => {
                      const Icon = REACTIONS.find(r => r.type === userReaction.type)?.icon;
                      return Icon ? <Icon className="h-4 w-4" /> : null;
                    })()}
                  </span>
                )}
                <span className="text-sm">{totalReactions}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">Beğen</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="flex gap-1">
            {REACTIONS.map((reaction) => {
              const Icon = reaction.icon;
              const isActive = userReaction?.type === reaction.type;
              return (
                <Button
                  key={reaction.type}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2 hover:scale-125 transition-transform",
                    isActive && "bg-accent"
                  )}
                  onClick={() => handleReaction(reaction.type)}
                  title={reaction.label}
                >
                  <Icon className={cn("h-5 w-5", reaction.color)} />
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Display reaction counts */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-1">
          {reactions.slice(0, 3).map((reaction) => {
            const reactionConfig = REACTIONS.find(r => r.type === reaction.type);
            if (!reactionConfig) return null;
            const Icon = reactionConfig.icon;
            return (
              <div
                key={reaction.type}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Icon className={cn("h-3 w-3", reactionConfig.color)} />
                <span>{reaction.count}</span>
              </div>
            );
          })}
          {reactions.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{reactions.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
