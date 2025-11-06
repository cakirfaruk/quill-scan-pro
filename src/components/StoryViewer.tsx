import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Eye, Send, Music, Volume2, VolumeX, BarChart3, MessageCircle, Share2, Loader2, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { StoryPollResults } from "./StoryPollResults";
import { StoryQuestionResults } from "./StoryQuestionResults";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
  music_url?: string;
  music_name?: string;
  music_artist?: string;
  stickers?: Array<{ emoji: string; x: number; y: number; size: number }>;
  gifs?: Array<{ url: string; x: number; y: number }>;
  text_effects?: Array<{ text: string; font: string; color: string; size: number; animation: string; x: number; y: number }>;
  background_color?: string;
  has_poll?: boolean;
  has_question?: boolean;
  filter_name?: string;
  filter_value?: string;
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
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [pollData, setPollData] = useState<any>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [selectedPollOptions, setSelectedPollOptions] = useState<number[]>([]);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [showPollResults, setShowPollResults] = useState(false);
  const [showQuestionResults, setShowQuestionResults] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingShare, setSendingShare] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentStory = stories[currentStoryIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    setCurrentStoryIndex(initialIndex);
    setProgress(0);
    loadStoryInteractions();
  }, [initialIndex, open]);

  useEffect(() => {
    if (currentStory) {
      loadStoryInteractions();
      setPollData(null);
      setQuestionData(null);
      setSelectedPollOptions([]);
      setQuestionAnswer("");
    }
  }, [currentStoryIndex]);

  const loadStoryInteractions = async () => {
    if (!currentStory) return;

    // Load poll data
    if (currentStory.has_poll) {
      const { data: poll } = await supabase
        .from("story_polls" as any)
        .select("*")
        .eq("story_id", currentStory.id)
        .single();
      
      if (poll) {
        const { data: userVote } = await supabase
          .from("story_poll_votes" as any)
          .select("option_ids")
          .eq("poll_id", (poll as any).id)
          .eq("user_id", currentUserId)
          .single();
        
        setPollData(poll);
        setSelectedPollOptions((userVote as any)?.option_ids || []);
      }
    }

    // Load question data
    if (currentStory.has_question) {
      const { data: question } = await supabase
        .from("story_questions" as any)
        .select("*")
        .eq("story_id", currentStory.id)
        .single();
      
      if (question) {
        const { data: userAnswer } = await supabase
          .from("story_question_answers" as any)
          .select("answer")
          .eq("question_id", (question as any).id)
          .eq("user_id", currentUserId)
          .single();
        
        setQuestionData(question);
        setQuestionAnswer((userAnswer as any)?.answer || "");
      }
    }
  };

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

  const handleSendReply = async () => {
    if (!replyText.trim() || currentStory.user_id === currentUserId) return;

    setIsSendingReply(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: currentStory.user_id,
        content: `📖 Hikayen hakkında: ${replyText}`,
        message_category: "other",
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Yanıtınız gönderildi",
      });

      setReplyText("");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Yanıt gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handlePollVote = async (optionId: number) => {
    if (!pollData || currentStory.user_id === currentUserId) return;

    try {
      const { data: existingVote } = await supabase
        .from("story_poll_votes" as any)
        .select("*")
        .eq("poll_id", (pollData as any).id)
        .eq("user_id", currentUserId)
        .single();

      if (existingVote) {
        await supabase
          .from("story_poll_votes" as any)
          .update({ option_ids: [optionId] } as any)
          .eq("id", (existingVote as any).id);
      } else {
        await supabase
          .from("story_poll_votes" as any)
          .insert({
            poll_id: (pollData as any).id,
            user_id: currentUserId,
            option_ids: [optionId],
          } as any);
      }

      setSelectedPollOptions([optionId]);
      toast({
        title: "Başarılı",
        description: "Oyunuz kaydedildi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Oy kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleQuestionSubmit = async () => {
    if (!questionData || !questionAnswer.trim() || currentStory.user_id === currentUserId) return;

    try {
      const { data: existingAnswer } = await supabase
        .from("story_question_answers" as any)
        .select("*")
        .eq("question_id", (questionData as any).id)
        .eq("user_id", currentUserId)
        .single();

      if (existingAnswer) {
        await supabase
          .from("story_question_answers" as any)
          .update({ answer: questionAnswer } as any)
          .eq("id", (existingAnswer as any).id);
      } else {
        await supabase
          .from("story_question_answers" as any)
          .insert({
            question_id: (questionData as any).id,
            user_id: currentUserId,
            answer: questionAnswer,
          } as any);
      }

      toast({
        title: "Başarılı",
        description: "Yanıtınız gönderildi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yanıt gönderilemedi",
        variant: "destructive",
      });
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      // Get all users this person has messaged or received messages from
      const { data: sentMessages } = await supabase
        .from("messages")
        .select("receiver_id")
        .eq("sender_id", currentUserId);

      const { data: receivedMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", currentUserId);

      const uniqueUserIds = new Set([
        ...(sentMessages?.map(m => m.receiver_id) || []),
        ...(receivedMessages?.map(m => m.sender_id) || [])
      ]);

      if (uniqueUserIds.size === 0) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", Array.from(uniqueUserIds));

      if (profiles) {
        setFriends(profiles);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFriends.size === friends.length) {
      setSelectedFriends(new Set());
    } else {
      setSelectedFriends(new Set(friends.map(f => f.user_id)));
    }
  };

  const handleShare = async () => {
    if (selectedFriends.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir arkadaş seçin",
        variant: "destructive",
      });
      return;
    }

    setSendingShare(true);
    try {
      const storyOwnerName = currentStory.profile.full_name || currentStory.profile.username;
      const messageContent = `📖 ${storyOwnerName} bir story paylaştı!\n\nStory'yi görmek için story bölümüne gidin.`;

      // Send messages to all selected friends
      const messages = Array.from(selectedFriends).map(friendId => ({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: messageContent,
        message_category: "other",
      }));

      const { error } = await supabase.from("messages").insert(messages);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Story ${selectedFriends.size} arkadaşınıza paylaşıldı`,
      });

      setShowShareDialog(false);
      setSelectedFriends(new Set());
    } catch (error) {
      console.error("Error sharing story:", error);
      toast({
        title: "Hata",
        description: "Paylaşım sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSendingShare(false);
    }
  };

  const handleOpenShareDialog = () => {
    setShowShareDialog(true);
    setSelectedFriends(new Set());
    loadFriends();
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
                {currentStory.filter_name && currentStory.filter_name !== "Normal" && (
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    ✨ {currentStory.filter_name}
                  </p>
                )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenShareDialog();
                }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
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
          className="relative w-full aspect-[9/16] flex items-center justify-center"
          style={{ 
            backgroundColor: currentStory.background_color || "#000000",
            filter: currentStory.filter_value || "none"
          }}
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

          {/* Music player */}
          {currentStory.music_url && (
            <>
              <audio
                ref={audioRef}
                src={currentStory.music_url}
                autoPlay
                loop
              />
              <div className="absolute top-16 right-4 z-40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/30 hover:bg-black/50 text-white rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMusic();
                  }}
                >
                  {isMusicPlaying ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </Button>
                {currentStory.music_name && (
                  <div className="mt-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
                    <Music className="w-3 h-3 inline mr-1" />
                    {currentStory.music_name}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Stickers */}
          {currentStory.stickers?.map((sticker, index) => (
            <div
              key={index}
              className="absolute pointer-events-none"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                fontSize: `${sticker.size}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {sticker.emoji}
            </div>
          ))}

          {/* GIFs */}
          {currentStory.gifs?.map((gif, index) => (
            <img
              key={index}
              src={gif.url}
              alt="GIF"
              className="absolute pointer-events-none w-32 h-32 object-contain"
              style={{
                left: `${gif.x}%`,
                top: `${gif.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Text Effects */}
          {currentStory.text_effects?.map((textEffect, index) => (
            <div
              key={index}
              className="absolute pointer-events-none"
              style={{
                left: `${textEffect.x}%`,
                top: `${textEffect.y}%`,
                fontFamily: textEffect.font,
                color: textEffect.color,
                fontSize: `${textEffect.size}px`,
                transform: "translate(-50%, -50%)",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {textEffect.text}
            </div>
          ))}

          {/* Poll */}
          {pollData && currentStory.user_id !== currentUserId && (
            <div className="absolute bottom-24 left-4 right-4 z-40 bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <p className="text-white font-semibold text-sm">{pollData.question}</p>
              <div className="space-y-2">
                {pollData.options?.map((option: any) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className={`w-full justify-start ${
                      selectedPollOptions.includes(option.id)
                        ? "bg-primary/20 border-primary text-white"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePollVote(option.id);
                    }}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Poll Results Button for Owner */}
          {pollData && currentStory.user_id === currentUserId && (
            <div className="absolute bottom-24 left-4 right-4 z-40">
              <Button
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPollResults(true);
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Anket Sonuçlarını Görüntüle
              </Button>
            </div>
          )}

          {/* Question */}
          {questionData && currentStory.user_id !== currentUserId && (
            <div className="absolute bottom-24 left-4 right-4 z-40 bg-black/70 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <p className="text-white font-semibold text-sm">{questionData.question}</p>
              <div className="flex gap-2">
                <Input
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  placeholder="Yanıtınızı yazın..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      handleQuestionSubmit();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuestionSubmit();
                  }}
                  disabled={!questionAnswer.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Question Results Button for Owner */}
          {questionData && currentStory.user_id === currentUserId && (
            <div className="absolute bottom-24 left-4 right-4 z-40">
              <Button
                variant="secondary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuestionResults(true);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Soru Yanıtlarını Görüntüle
              </Button>
            </div>
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

        {/* Footer with reply input or delete button */}
        {currentStory.user_id === currentUserId ? (
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
        ) : (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${currentStory.profile.username}'e yanıtla...`}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSendingReply}
                className="bg-primary hover:bg-primary/90"
              >
                {isSendingReply ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Poll Results Dialog */}
      {pollData && (
        <StoryPollResults
          open={showPollResults}
          onOpenChange={setShowPollResults}
          pollId={(pollData as any).id}
          question={(pollData as any).question}
          options={(pollData as any).options || []}
        />
      )}

      {/* Question Results Dialog */}
      {questionData && (
        <StoryQuestionResults
          open={showQuestionResults}
          onOpenChange={setShowQuestionResults}
          questionId={(questionData as any).id}
          question={(questionData as any).question}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <span>Story'yi Paylaş</span>
                {selectedFriends.size > 0 && (
                  <Badge variant="secondary">
                    {selectedFriends.size} seçili
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bu story'yi arkadaşlarınızla paylaşın
              </p>
            </div>

            {loadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz arkadaşınız yok
              </p>
            ) : (
              <>
                {/* Select All / Deselect All */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-story"
                      checked={selectedFriends.size === friends.length && friends.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="select-all-story"
                      className="text-sm font-medium cursor-pointer"
                    >
                      {selectedFriends.size === friends.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {friends.length} arkadaş
                  </span>
                </div>

                {/* Friends List */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {friends.map((friend) => {
                    const isSelected = selectedFriends.has(friend.user_id);
                    return (
                      <div
                        key={friend.user_id}
                        onClick={() => toggleFriendSelection(friend.user_id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFriendSelection(friend.user_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.profile_photo} />
                          <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {friend.full_name || friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Share Button */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                    className="flex-1"
                    disabled={sendingShare}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleShare}
                    disabled={sendingShare || selectedFriends.size === 0}
                    className="flex-1"
                  >
                    {sendingShare ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        {selectedFriends.size > 0 
                          ? `${selectedFriends.size} Kişiye Gönder` 
                          : "Gönder"}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
