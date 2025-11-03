import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  created_at: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  views_count: number;
  has_viewed: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export const StoryViewer = ({
  stories,
  initialIndex,
  open,
  onOpenChange,
  currentUserId,
}: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const currentStory = stories[currentStoryIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    setCurrentStoryIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open || !currentStory || isPaused) return;

    // Mark story as viewed
    if (!currentStory.has_viewed && currentStory.user_id !== currentUserId) {
      markAsViewed(currentStory.id);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / STORY_DURATION) * 50;
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStoryIndex, open, isPaused]);

  const markAsViewed = async (storyId: string) => {
    try {
      await supabase.from("story_views").insert({
        story_id: storyId,
        viewer_id: currentUserId,
      });
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (currentStory.user_id !== currentUserId) return;

    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", currentStory.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Hikaye silindi",
      });

      if (stories.length === 1) {
        onOpenChange(false);
      } else {
        handleNext();
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Hikaye silinemedi",
        variant: "destructive",
      });
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-black border-0 overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
          {stories.map((_, index) => (
            <Progress
              key={index}
              value={
                index === currentStoryIndex
                  ? progress
                  : index < currentStoryIndex
                  ? 100
                  : 0
              }
              className="h-0.5 bg-white/30"
            />
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-white">
                <AvatarImage src={currentStory.profile.profile_photo || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentStory.profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">
                  {currentStory.profile.full_name || currentStory.profile.username}
                </p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentStory.user_id === currentUserId && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-medium">
                    {currentStory.views_count}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Story content */}
        <div
          className="relative w-full aspect-[9/16] bg-black flex items-center justify-center"
          onClick={() => setIsPaused(!isPaused)}
        >
          {currentStory.media_type === "photo" ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={isPaused}
              onEnded={handleNext}
            />
          )}

          {/* Navigation overlays */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />

          {/* Navigation buttons (visible on hover) */}
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            {currentStoryIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/30 hover:bg-black/50 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            <div className="flex-1" />
            {currentStoryIndex < stories.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/30 hover:bg-black/50 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer with delete button */}
        {currentStory.user_id === currentUserId && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDelete}
            >
              Hikayeyi Sil
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
