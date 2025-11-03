import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractMentions, extractHashtags } from "@/utils/textParsing";
import { 
  Image, 
  Video, 
  Sparkles, 
  X, 
  Loader2, 
  AtSign,
  Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { z } from "zod";

const postSchema = z.object({
  content: z.string()
    .trim()
    .max(5000, "Gönderi içeriği çok uzun (maksimum 5000 karakter)"),
});

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  profilePhoto: string | null;
  onPostCreated?: () => void;
  prefilledContent?: {
    type: "analysis" | "photo";
    content?: string;
    mediaUrl?: string;
    mediaType?: "photo" | "video";
  };
}

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

export const CreatePostDialog = ({
  open,
  onOpenChange,
  userId,
  username,
  profilePhoto,
  onPostCreated,
  prefilledContent,
}: CreatePostDialogProps) => {
  const [postType, setPostType] = useState<"photo" | "video" | "reels">("photo");
  const [content, setContent] = useState(prefilledContent?.content || "");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    prefilledContent?.mediaUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [taggedFriends, setTaggedFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load friends when tag picker opens
  const loadFriends = async () => {
    if (friends.length > 0) return;

    const { data: friendsData } = await supabase
      .from("friends")
      .select(`
        user_id,
        friend_id,
        user_profile:profiles!friends_user_id_fkey(user_id, username, full_name, profile_photo),
        friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    if (friendsData) {
      const friendsList: Friend[] = friendsData.map((f: any) => {
        const isSender = f.user_id === userId;
        const profile = isSender ? f.friend_profile : f.user_profile;
        return {
          user_id: profile.user_id,
          username: profile.username,
          full_name: profile.full_name,
          profile_photo: profile.profile_photo,
        };
      });
      setFriends(friendsList);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Dosya çok büyük",
        description: "Maksimum dosya boyutu 50MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleTagFriend = (friend: Friend) => {
    if (!taggedFriends.find(f => f.user_id === friend.user_id)) {
      setTaggedFriends([...taggedFriends, friend]);
      setContent((prev) => prev + `@${friend.username} `);
    }
    setShowTagPicker(false);
    setSearchQuery("");
  };

  const handleRemoveTag = (friendId: string) => {
    const friend = taggedFriends.find(f => f.user_id === friendId);
    if (friend) {
      setContent((prev) => prev.replace(`@${friend.username} `, ""));
      setTaggedFriends(taggedFriends.filter(f => f.user_id !== friendId));
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaPreview) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir içerik veya medya ekleyin",
        variant: "destructive",
      });
      return;
    }

    // Validate content
    const validation = postSchema.safeParse({ content });
    if (!validation.success) {
      toast({
        title: "Geçersiz İçerik",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extract mentions and hashtags
      const mentions = extractMentions(content);
      const hashtags = extractHashtags(content);

      // Create post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: content.trim(),
          media_url: mediaPreview,
          media_type: mediaPreview ? (postType === "video" || postType === "reels" ? "video" : "photo") : null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Process hashtags
      for (const tag of hashtags) {
        try {
          // Get or create hashtag
          const { data: hashtagData } = await supabase
            .rpc('increment_hashtag_usage', { tag_text: tag });

          if (hashtagData) {
            // Link hashtag to post
            await supabase
              .from("post_hashtags")
              .insert({
                post_id: postData.id,
                hashtag_id: hashtagData,
              });
          }
        } catch (error) {
          console.error("Error processing hashtag:", tag, error);
        }
      }

      // Process mentions
      for (const username of mentions) {
        try {
          // Get user ID from username
          const { data: userData } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("username", username)
            .single();

          if (userData) {
            // Create mention
            await supabase
              .from("post_mentions")
              .insert({
                post_id: postData.id,
                mentioned_user_id: userData.user_id,
              });
          }
        } catch (error) {
          console.error("Error processing mention:", username, error);
        }
      }

      toast({
        title: "Başarılı",
        description: "Gönderi oluşturuldu",
      });

      // Reset form
      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setTaggedFriends([]);
      onOpenChange(false);
      onPostCreated?.();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Gönderi oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Yeni Gönderi Oluştur</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Fotoğraf, video veya reels paylaşın ve arkadaşlarınızı etiketleyin
          </DialogDescription>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v: any) => setPostType(v)} className="px-4 sm:px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Fotoğraf</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Reels</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-220px)] px-4 sm:px-6">
          <div className="space-y-4 pb-4">
            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                <AvatarImage src={profilePhoto || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
                  {username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm sm:text-base">{username}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {postType === "reels" ? "Reels" : postType === "video" ? "Video" : "Fotoğraf"} paylaşımı
                </p>
              </div>
            </div>

            {/* Media Upload/Preview */}
            <div className="space-y-2">
              {!mediaPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  {postType === "photo" ? (
                    <Image className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
                  ) : (
                    <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {postType === "photo"
                      ? "Fotoğraf yüklemek için tıklayın"
                      : "Video yüklemek için tıklayın"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Maksimum 50MB
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden">
                  {postType === "photo" ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-96 rounded-lg"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={handleRemoveMedia}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={postType === "photo" ? "image/*" : "video/*"}
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <div className="relative">
                <Textarea
                  placeholder="Bir şeyler yazın..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                  maxLength={5000}
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-0" align="end">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </PopoverContent>
                  </Popover>

                  <Popover open={showTagPicker} onOpenChange={(open) => {
                    setShowTagPicker(open);
                    if (open) loadFriends();
                  }}>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <AtSign className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Arkadaş ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {filteredFriends.map((friend) => (
                              <button
                                key={friend.user_id}
                                onClick={() => handleTagFriend(friend)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={friend.profile_photo || undefined} />
                                  <AvatarFallback>
                                    {friend.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium">
                                    {friend.full_name || friend.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    @{friend.username}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Tagged Friends */}
            {taggedFriends.length > 0 && (
              <div className="space-y-2">
                <Label>Etiketlenenler</Label>
                <div className="flex flex-wrap gap-2">
                  {taggedFriends.map((friend) => (
                    <Badge
                      key={friend.user_id}
                      variant="secondary"
                      className="gap-2 pr-1"
                    >
                      @{friend.username}
                      <button
                        onClick={() => handleRemoveTag(friend.user_id)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-xs sm:text-sm"
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            onClick={handleCreatePost}
            className="flex-1 gap-1 sm:gap-2 text-xs sm:text-sm"
            disabled={isLoading || (!content.trim() && !mediaPreview)}
          >
            {isLoading && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />}
            Paylaş
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};