import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/hooks/use-draft";
import { extractMentions, extractHashtags } from "@/utils/textParsing";
import { 
  Image, 
  Video, 
  X, 
  Loader2, 
  AtSign,
  Smile,
  Save,
  ArrowLeft,
  Check,
  Camera,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  Plus,
  Maximize2,
  MapPin,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PhotoCaptureEditor } from "@/components/PhotoCaptureEditor";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceAutocompleteInput } from "@/components/PlaceAutocompleteInput";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import type { VideoQuality } from "@/utils/storageUpload";
import { compressVideo } from "@/utils/storageUpload";
import { useEnhancedOfflineSync } from "@/hooks/use-enhanced-offline-sync";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOptimisticUI } from "@/hooks/use-optimistic-ui";

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
  const [step, setStep] = useState<"select" | "capture" | "edit" | "share">("select");
  const [postType, setPostType] = useState<"photo" | "video" | "reels">("photo");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('medium');
  const [content, setContent] = useState(prefilledContent?.content || "");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: "photo" | "video" }>>(
    prefilledContent?.mediaUrl ? [{ url: prefilledContent.mediaUrl, type: prefilledContent.mediaType || "photo" }] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [taggedFriends, setTaggedFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [locationName, setLocationName] = useState("");
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselApiRef = useRef<any>(null);
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const { addToQueue } = useEnhancedOfflineSync();
  const { addOptimisticItem } = useOptimisticUI();

  // Draft management
  const draft = useDraft({
    key: `post_${userId}`,
    maxLength: 5000,
    autoSaveDelay: 2000,
    onRestore: (draftContent) => setContent(draftContent),
  });

  // Auto-save draft when content changes
  useEffect(() => {
    if (!open || !content.trim()) return;
    
    const cleanup = draft.autoSave(content);
    return cleanup;
  }, [content, open]);

  // Restore draft when dialog opens
  useEffect(() => {
    if (open && !prefilledContent?.content && draft.hasDraft) {
      const restored = draft.restoreDraft();
      if (restored) {
        setContent(restored);
      }
    }
  }, [open]);

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

  // Detect video orientation (aspect ratio)
  const detectVideoOrientation = (file: File): Promise<'vertical' | 'horizontal' | 'square'> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const aspectRatio = video.videoWidth / video.videoHeight;
        if (aspectRatio < 0.8) {
          resolve('vertical'); // Dik video (9:16 veya daha dar)
        } else if (aspectRatio > 1.2) {
          resolve('horizontal'); // Yatay video
        } else {
          resolve('square'); // Kare video
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve('square'); // Hata durumunda kare olarak kabul et
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Max 10 files
    if (mediaPreviews.length + files.length > 10) {
      toast({
        title: "Çok fazla dosya",
        description: "Maksimum 10 fotoğraf/video ekleyebilirsiniz.",
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: Array<{ url: string; type: "photo" | "video" }> = [];
    let hasVerticalVideo = false;

    // Process files sequentially to detect video orientation
    for (const file of files) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Dosya çok büyük",
          description: `${file.name} çok büyük. Maksimum dosya boyutu 50MB olabilir.`,
          variant: "destructive",
        });
        continue;
      }

      let processedFile = file;
      const type = file.type.startsWith("video") ? "video" : "photo";

      // Compress video files
      if (type === "video") {
        toast({
          title: "Video İşleniyor...",
          description: "Video sıkıştırılıyor, lütfen bekleyin",
        });

        try {
          const compressedBlob = await compressVideo(file, { quality: videoQuality });
          processedFile = new File([compressedBlob], file.name, { type: 'video/webm' });
          
          const originalSize = (file.size / (1024 * 1024)).toFixed(2);
          const compressedSize = (processedFile.size / (1024 * 1024)).toFixed(2);
          const savings = ((1 - processedFile.size / file.size) * 100).toFixed(0);
          
          toast({
            title: "Video Sıkıştırıldı ✓",
            description: `${originalSize}MB → ${compressedSize}MB (${savings}% tasarruf)`,
          });
        } catch (error) {
          console.error('Video compression failed:', error);
          toast({
            title: "Sıkıştırma Başarısız",
            description: "Orijinal video kullanılacak",
            variant: "destructive",
          });
        }
      }

      validFiles.push(processedFile);

      // Create preview
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(processedFile);
      });

      newPreviews.push({ url, type });

      // Detect video orientation
      if (file.type.startsWith("video")) {
        const orientation = await detectVideoOrientation(file);
        if (orientation === 'vertical') {
          hasVerticalVideo = true;
        }
      }
    }

    // Update state
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
    setMediaFiles([...mediaFiles, ...validFiles]);

    // Auto-set post type based on video orientation
    if (hasVerticalVideo) {
      setPostType('reels');
      toast({
        title: "Reels Tespit Edildi 🎬",
        description: "Dikey videonuz Reels olarak paylaşılacak!",
      });
    } else if (newPreviews.some(p => p.type === 'video')) {
      setPostType('video');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    if (index === selectedMediaIndex && index > 0) {
      setSelectedMediaIndex(index - 1);
    }
    if (fileInputRef.current && mediaPreviews.length === 1) {
      fileInputRef.current.value = "";
    }
  };

  const handleMoveMedia = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= mediaPreviews.length) return;
    
    const newPreviews = [...mediaPreviews];
    const newFiles = [...mediaFiles];
    
    // Swap items
    [newPreviews[fromIndex], newPreviews[toIndex]] = [newPreviews[toIndex], newPreviews[fromIndex]];
    if (newFiles.length > 0) {
      [newFiles[fromIndex], newFiles[toIndex]] = [newFiles[toIndex], newFiles[fromIndex]];
    }
    
    setMediaPreviews(newPreviews);
    setMediaFiles(newFiles);
    setSelectedMediaIndex(toIndex);
    
    // Update carousel position
    if (carouselApiRef.current) {
      carouselApiRef.current.scrollTo(toIndex);
    }
  };

  const handleAddMoreMedia = () => {
    fileInputRef.current?.click();
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
    if (!content.trim() && mediaPreviews.length === 0) {
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

      if (!isOnline) {
        // Offline - add optimistically and queue
        const optimisticId = addOptimisticItem('post', {
          user_id: userId,
          content: content.trim(),
          media_urls: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.url) : null,
          media_types: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.type) : null,
          post_type: postType,
          location_name: locationName || null,
          location_latitude: locationLatitude,
          location_longitude: locationLongitude,
          mentions,
          hashtags,
          taggedFriends: taggedFriends.map(f => f.user_id),
          created_at: new Date().toISOString(),
        });
        
        // Reset form
        setContent("");
        setMediaFiles([]);
        setMediaPreviews([]);
        setTaggedFriends([]);
        setLocationName("");
        setLocationLatitude(null);
        setLocationLongitude(null);
        draft.clearDraft();
        
        if (onPostCreated) onPostCreated();
        return;
      }

      // Create post with media arrays and location
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: content.trim(),
          media_urls: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.url) : null,
          media_types: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.type) : null,
          post_type: postType,
          location_name: locationName || null,
          location_latitude: locationLatitude,
          location_longitude: locationLongitude,
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

      // Clear draft after successful post
      draft.clearDraft();

      // Reset form
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setTaggedFriends([]);
      setLocationName("");
      setLocationLatitude(null);
      setLocationLongitude(null);
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

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (prefilledContent?.mediaUrl) {
        setStep("share");
      } else {
        setStep("select");
      }
    } else {
      setStep("select");
    }
  }, [open]);

  const handlePhotoCapture = (imageData: string) => {
    setMediaPreviews([...mediaPreviews, { url: imageData, type: "photo" }]);
    setShowPhotoEditor(false);
    setStep("share");
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {step !== "select" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "share") setStep("select");
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri
              </Button>
            )}
            <h2 className="font-semibold text-lg flex-1 text-center">
              {step === "select" && "Yeni Gönderi"}
              {step === "share" && "Gönderi Oluştur"}
            </h2>
            {step === "share" && (
              <Button
                onClick={handleCreatePost}
                disabled={isLoading || (!content.trim() && mediaPreviews.length === 0)}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Paylaş
              </Button>
            )}
            {step === "select" && <div className="w-20" />}
          </div>


          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Step 1: Selection */}
              {step === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className="grid grid-cols-2 gap-4 p-6 h-full">
                    <button
                      onClick={() => setShowPhotoEditor(true)}
                      className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 hover:border-primary hover:bg-accent transition-all group"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-10 h-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg mb-1">Kamera</h3>
                        <p className="text-sm text-muted-foreground">Fotoğraf çek ve düzenle</p>
                      </div>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 hover:border-primary hover:bg-accent transition-all group"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-10 h-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg mb-1">Galeri</h3>
                        <p className="text-sm text-muted-foreground">Fotoğraf/Video seç (max 10)</p>
                      </div>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e);
                      if (e.target.files && e.target.files.length > 0) {
                        setStep("share");
                      }
                    }}
                  />
                </motion.div>
              )}

              {/* Step 2: Share */}
              {step === "share" && (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <ScrollArea className="h-[calc(95vh-120px)]">
                    <div className="p-6 space-y-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profilePhoto || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{username}</p>
                        </div>
                      </div>

                      {/* Video/Reels Toggle */}
                      {mediaPreviews.some(m => m.type === 'video') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${postType === 'reels' ? 'bg-primary/10' : 'bg-muted'}`}>
                                {postType === 'reels' ? (
                                  <Film className="w-5 h-5 text-primary" />
                                ) : (
                                  <Video className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {postType === 'reels' ? 'Reels Olarak Paylaş' : 'Normal Video Olarak Paylaş'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {postType === 'reels' 
                                    ? 'Videolar Reels sayfasında görünecek' 
                                    : 'Videolar akış sayfasında görünecek'}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={postType === 'reels'}
                              onCheckedChange={(checked) => {
                                setPostType(checked ? 'reels' : 'video');
                                toast({
                                  title: checked ? "Reels Modu 🎬" : "Video Modu 📹",
                                  description: checked 
                                    ? "Video Reels olarak paylaşılacak" 
                                    : "Video normal gönderi olarak paylaşılacak",
                                });
                              }}
                            />
                          </div>

                          {/* Video Quality Selector */}
                          <div className="p-3 bg-accent/50 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">Video Kalitesi</p>
                                <p className="text-xs text-muted-foreground">Yükleme hızını optimize edin</p>
                              </div>
                              <Select value={videoQuality} onValueChange={(value: VideoQuality) => setVideoQuality(value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">
                                    <span className="flex items-center gap-2">
                                      ⚡ Yüksek
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    <span className="flex items-center gap-2">
                                      ✨ Orta
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="low">
                                    <span className="flex items-center gap-2">
                                      🚀 Düşük
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Media Preview with Carousel */}
                      {mediaPreviews.length > 0 && (
                        <div className="space-y-3">
                          {/* Main Preview */}
                          <div className="relative">
                            {mediaPreviews.length === 1 ? (
                              <div className="relative rounded-lg overflow-hidden bg-black">
                                {mediaPreviews[0].type === "photo" ? (
                                  <img
                                    src={mediaPreviews[0].url}
                                    alt="Preview"
                                    className="w-full max-h-96 object-contain"
                                  />
                                ) : (
                                  <video
                                    src={mediaPreviews[0].url}
                                    controls
                                    className="w-full max-h-96"
                                  />
                                )}
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="absolute top-2 right-2 rounded-full"
                                  onClick={() => handleRemoveMedia(0)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Carousel 
                                className="w-full"
                                opts={{ startIndex: selectedMediaIndex }}
                                setApi={(api) => {
                                  carouselApiRef.current = api;
                                  api?.on('select', () => {
                                    setSelectedMediaIndex(api.selectedScrollSnap());
                                  });
                                }}
                              >
                                <CarouselContent>
                                  {mediaPreviews.map((media, index) => (
                                    <CarouselItem key={index}>
                                      <div className="relative rounded-lg overflow-hidden bg-black">
                                        {media.type === "photo" ? (
                                          <img
                                            src={media.url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full max-h-96 object-contain"
                                          />
                                        ) : (
                                          <video
                                            src={media.url}
                                            controls
                                            className="w-full max-h-96"
                                          />
                                        )}
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                          {index + 1} / {mediaPreviews.length}
                                        </div>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                              </Carousel>
                            )}
                          </div>

                          {/* Media Editor - Thumbnails Grid */}
                          {mediaPreviews.length > 1 && (
                            <div className="space-y-2">
                              <Label className="text-sm">Medya Düzenle ({mediaPreviews.length}/10)</Label>
                              <div className="grid grid-cols-5 gap-2">
                                {mediaPreviews.map((media, index) => (
                                  <div
                                    key={index}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                      selectedMediaIndex === index 
                                        ? 'border-primary ring-2 ring-primary/20' 
                                        : 'border-transparent hover:border-primary/50'
                                    }`}
                                    onClick={() => {
                                      setSelectedMediaIndex(index);
                                      if (carouselApiRef.current) {
                                        carouselApiRef.current.scrollTo(index);
                                      }
                                    }}
                                  >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-black">
                                      {media.type === "photo" ? (
                                        <img
                                          src={media.url}
                                          alt={`Thumb ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center relative">
                                          <video
                                            src={media.url}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Video className="w-6 h-6 text-white" />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Controls Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                      {/* Move Up */}
                                      {index > 0 && (
                                        <Button
                                          size="icon"
                                          variant="secondary"
                                          className="h-7 w-7 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveMedia(index, index - 1);
                                          }}
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </Button>
                                      )}
                                      
                                      {/* Delete */}
                                      <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-7 w-7 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveMedia(index);
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>

                                      {/* Move Down */}
                                      {index < mediaPreviews.length - 1 && (
                                        <Button
                                          size="icon"
                                          variant="secondary"
                                          className="h-7 w-7 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveMedia(index, index + 1);
                                          }}
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>

                                    {/* Index Badge */}
                                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                      {index + 1}
                                    </div>
                                  </div>
                                ))}

                                {/* Add More Button */}
                                {mediaPreviews.length < 10 && (
                                  <button
                                    onClick={handleAddMoreMedia}
                                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent transition-all flex flex-col items-center justify-center gap-1"
                                  >
                                    <Plus className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Ekle</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Add More Button for Single Media */}
                          {mediaPreviews.length === 1 && mediaPreviews.length < 10 && (
                            <Button
                              variant="outline"
                              onClick={handleAddMoreMedia}
                              className="w-full gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Daha Fazla Ekle ({mediaPreviews.length}/10)
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Caption */}
                      <div className="space-y-2">
                        <Label>Açıklama Ekle</Label>
                        <div className="relative">
                          <Textarea
                            placeholder="Bir şeyler yazın..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="resize-none pr-20"
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
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                  />
                                  <ScrollArea className="h-48">
                                    <div className="space-y-2">
                                      {filteredFriends.map((friend) => (
                                        <button
                                          key={friend.user_id}
                                          onClick={() => handleTagFriend(friend)}
                                          className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                                        >
                                          <Avatar className="w-8 h-8">
                                            <AvatarImage src={friend.profile_photo || undefined} />
                                            <AvatarFallback>
                                              {friend.username.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="text-left flex-1">
                                            <p className="text-sm font-medium">{friend.username}</p>
                                            {friend.full_name && (
                                              <p className="text-xs text-muted-foreground">
                                                {friend.full_name}
                                              </p>
                                            )}
                                          </div>
                                        </button>
                                      ))}
                                      {filteredFriends.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                          Arkadaş bulunamadı
                                        </p>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {content.length}/5000
                          </div>
                        </div>
                      </div>

                      {/* Tagged Friends */}
                      {taggedFriends.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Etiketlenen Kişiler</Label>
                          <div className="flex flex-wrap gap-2">
                            {taggedFriends.map((friend) => (
                              <Badge key={friend.user_id} variant="secondary" className="gap-1">
                                @{friend.username}
                                <button
                                  onClick={() => handleRemoveTag(friend.user_id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location Selection */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Konum Ekle
                        </Label>
                        <PlaceAutocompleteInput
                          value={locationName}
                          onChange={setLocationName}
                          onPlaceSelect={(place) => {
                            setLocationName(place.name);
                            setLocationLatitude(place.latitude);
                            setLocationLongitude(place.longitude);
                          }}
                          placeholder="Konum ara..."
                          id="postLocation"
                        />
                        {locationName && (
                          <div className="flex items-center justify-between p-2 bg-accent rounded-md">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>{locationName}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                setLocationName("");
                                setLocationLatitude(null);
                                setLocationLongitude(null);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Capture Editor */}
      <PhotoCaptureEditor
        open={showPhotoEditor}
        onOpenChange={setShowPhotoEditor}
        onCapture={handlePhotoCapture}
        title="Fotoğraf Çek"
        description="Kamera ile fotoğraf çekin veya galeriden seçin"
      />
    </>
  );
};