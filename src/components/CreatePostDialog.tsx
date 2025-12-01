import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Settings,
  RefreshCw,
  Clock,
  Upload,
  FileImage,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PhotoCaptureEditor } from "@/components/PhotoCaptureEditor";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceAutocompleteInput } from "@/components/PlaceAutocompleteInput";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { z } from "zod";
import type { VideoQuality } from "@/utils/storageUpload";
import { compressVideo, generateVideoThumbnail, uploadToStorage } from "@/utils/storageUpload";
import { GifPicker } from "@/components/GifPicker";

// Validation schema for thumbnail image
const thumbnailImageSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.type.startsWith('image/'), {
      message: "Sadece resim dosyaları yüklenebilir"
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Resim boyutu maksimum 5MB olabilir"
    })
    .refine((file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type), {
      message: "Sadece JPG, PNG veya WebP formatları desteklenir"
    })
});
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
    type: "analysis" | "photo" | "quote";
    content?: string;
    mediaUrl?: string;
    mediaType?: "photo" | "video";
    quotedPostId?: string;
    quotedPostData?: any;
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
  const [postType, setPostType] = useState<"photo" | "video" | "reels" | "gif">("photo");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('medium');
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadFile, setCurrentUploadFile] = useState<string>("");
  const [totalUploadProgress, setTotalUploadProgress] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [thumbnailPickerIndex, setThumbnailPickerIndex] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [thumbnailTime, setThumbnailTime] = useState<number>(0.5);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>("");
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
  const [customThumbnailPreview, setCustomThumbnailPreview] = useState<string>("");
  const thumbnailVideoRef = useRef<HTMLVideoElement>(null);
  const customThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(prefilledContent?.content || "");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ 
    url: string; 
    type: "photo" | "video" | "gif";
    thumbnail?: string;
    duration?: number;
  }>>(
    prefilledContent?.mediaUrl ? [{ url: prefilledContent.mediaUrl, type: prefilledContent.mediaType || "photo" }] : []
  );
  const [gifUrl, setGifUrl] = useState<string>("");
  const [showGifPicker, setShowGifPicker] = useState(false);
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
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [quotedPostId, setQuotedPostId] = useState<string | null>(prefilledContent?.quotedPostId || null);
  const [quotedPostData, setQuotedPostData] = useState<any>(prefilledContent?.quotedPostData || null);
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

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Format duration to MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const newPreviews: Array<{ url: string; type: "photo" | "video"; thumbnail?: string; duration?: number }> = [];
    let hasVerticalVideo = false;

    // Process files sequentially to detect video orientation
    for (const file of files) {
      let processedFile = file;
      const type = file.type.startsWith("video") ? "video" : "photo";

      let videoThumbnail: string | undefined;
      let videoDurationValue: number | undefined;

      // Compress video files - ALWAYS compress videos regardless of size
      if (type === "video") {
        setIsCompressing(true);
        setCompressionProgress(0);

        try {
          // Get video duration before compression
          videoDurationValue = await getVideoDuration(file);
          
          // Auto-select quality based on file size
          const fileSizeMB = file.size / (1024 * 1024);
          let autoQuality: VideoQuality = videoQuality;
          
          // Override quality for very large files
          if (fileSizeMB > 200) {
            autoQuality = 'low';
            toast({
              title: "Büyük Video Tespit Edildi",
              description: "Video otomatik olarak düşük kalitede sıkıştırılacak",
            });
          } else if (fileSizeMB > 100) {
            autoQuality = 'medium';
          }
          
          const result = await compressVideo(file, { 
            quality: autoQuality,
            onProgress: (progress) => {
              setCompressionProgress(progress);
            }
          });
          
          processedFile = new File([result.compressedVideo], file.name, { type: 'video/webm' });
          videoThumbnail = result.thumbnail;
          
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
            description: "Video yüklenemedi, lütfen tekrar deneyin",
            variant: "destructive",
          });
          setIsCompressing(false);
          setCompressionProgress(0);
          continue; // Skip this file
        } finally {
          setIsCompressing(false);
          setCompressionProgress(0);
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

      newPreviews.push({ 
        url, 
        type,
        thumbnail: videoThumbnail,
        duration: videoDurationValue
      });

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
    // Close thumbnail picker if the video being edited is removed
    if (thumbnailPickerIndex === index) {
      setShowThumbnailPicker(false);
      setThumbnailPickerIndex(null);
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

  const handleRegenerateThumbnail = async (videoIndex: number, timeInSeconds: number) => {
    const mediaFile = mediaFiles[videoIndex];
    if (!mediaFile || !mediaFile.type.startsWith('video/')) return;

    try {
      const newThumbnail = await generateVideoThumbnail(mediaFile, timeInSeconds);
      
      // Update the thumbnail for this specific video
      setMediaPreviews(prev => prev.map((media, idx) => 
        idx === videoIndex 
          ? { ...media, thumbnail: newThumbnail }
          : media
      ));

      toast({
        title: "Küçük Resim Güncellendi",
        description: "Video önizleme resmi değiştirildi",
      });
    } catch (error) {
      console.error('Failed to regenerate thumbnail:', error);
      toast({
        title: "Hata",
        description: "Küçük resim oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleOpenThumbnailPicker = async (videoIndex: number) => {
    const mediaFile = mediaFiles[videoIndex];
    if (!mediaFile || !mediaFile.type.startsWith('video/')) return;

    // Reset custom thumbnail
    setCustomThumbnailFile(null);
    setCustomThumbnailPreview("");

    // Get video duration and create preview URL
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      setThumbnailTime(video.duration * 0.5); // Start at 50%
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(mediaFile);

    // Set live preview URL
    setLivePreviewUrl(URL.createObjectURL(mediaFile));
    setThumbnailPickerIndex(videoIndex);
    setShowThumbnailPicker(true);
  };

  const handleCustomThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the uploaded image
    const validation = thumbnailImageSchema.safeParse({ file });
    
    if (!validation.success) {
      toast({
        title: "Geçersiz Dosya",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCustomThumbnailFile(file);
      setCustomThumbnailPreview(imageUrl);
      
      toast({
        title: "Özel Küçük Resim Yüklendi",
        description: "Kaydetmek için 'Kaydet' butonuna tıklayın",
      });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleSaveCustomThumbnail = () => {
    if (thumbnailPickerIndex === null) return;

    if (customThumbnailPreview) {
      // Use custom uploaded thumbnail
      setMediaPreviews(prev => prev.map((media, idx) => 
        idx === thumbnailPickerIndex 
          ? { ...media, thumbnail: customThumbnailPreview }
          : media
      ));

      toast({
        title: "Küçük Resim Kaydedildi",
        description: "Özel küçük resim uygulandı",
      });
    } else {
      // Use frame from video
      handleRegenerateThumbnail(thumbnailPickerIndex, thumbnailTime);
    }

    setShowThumbnailPicker(false);
  };

  // Update video current time when slider changes
  const handleThumbnailTimeChange = (value: number[]) => {
    setThumbnailTime(value[0]);
    if (thumbnailVideoRef.current) {
      thumbnailVideoRef.current.currentTime = value[0];
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

      // Upload media files to storage first
      const uploadedUrls: string[] = [];
      
      if (mediaFiles.length > 0) {
        setIsUploading(true);
        const totalFileCount = mediaFiles.length;
        setTotalFiles(totalFileCount);
        
        try {
          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const mediaType = mediaPreviews[i]?.type || 'photo';
            
            setCurrentFileIndex(i + 1);
            setCurrentUploadFile(file.name);
            setUploadProgress(0);
            
            const bucket = postType === 'reels' ? 'videos' : (mediaType === 'video' ? 'videos' : 'posts');
            const uploadedUrl = await uploadToStorage(file, bucket, userId, (progress) => {
              setUploadProgress(progress);
              // Calculate total progress across all files
              const totalProgress = ((i * 100) + progress) / totalFileCount;
              setTotalUploadProgress(Math.round(totalProgress));
            });
            
            if (!uploadedUrl) {
              throw new Error(`${file.name} yüklenemedi`);
            }
            
            uploadedUrls.push(uploadedUrl);
          }
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          const errorMessage = uploadError?.message || "Dosya yüklenemedi";
          toast({
            title: "Yükleme Hatası",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoading(false);
          setIsUploading(false);
          setUploadProgress(0);
          setTotalUploadProgress(0);
          setCurrentFileIndex(0);
          setTotalFiles(0);
          setCurrentUploadFile("");
          return;
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setTotalUploadProgress(0);
          setCurrentFileIndex(0);
          setTotalFiles(0);
          setCurrentUploadFile("");
        }
      }

      // Create post with uploaded URLs
      if (scheduledAt && scheduledAt > new Date()) {
        // Create scheduled post
        const { error: scheduledError } = await supabase
          .from("scheduled_posts")
          .insert({
            user_id: userId,
            content: content.trim(),
            media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
            media_types: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.type) : null,
            scheduled_for: scheduledAt.toISOString(),
            shared_post_id: quotedPostId,
          });

        if (scheduledError) throw scheduledError;

        toast({
          title: "Başarılı",
          description: `Gönderi ${scheduledAt.toLocaleString('tr-TR')} tarihinde paylaşılacak`,
        });
      } else {
        // Create immediate post
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: userId,
            content: content.trim(),
            media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
            media_types: mediaPreviews.length > 0 ? mediaPreviews.map(m => m.type) : null,
            post_type: postType,
            location_name: locationName || null,
            location_latitude: locationLatitude,
            location_longitude: locationLongitude,
            shared_post_id: quotedPostId,
          })
          .select()
          .single();

        if (postError) throw postError;

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
      }

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
        <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
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
          <div className="flex-1 overflow-y-auto">
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
                    
                    <button
                      onClick={() => setShowGifPicker(true)}
                      className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg border-2 hover:border-primary hover:bg-accent transition-all group"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileImage className="w-10 h-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg mb-1">GIF</h3>
                        <p className="text-sm text-muted-foreground">Animasyonlu GIF ekle</p>
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

                          {/* Video Compression Progress */}
                          {isCompressing && (
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  Video Sıkıştırılıyor...
                                </Label>
                                <span className="text-sm font-semibold text-primary">{compressionProgress}%</span>
                              </div>
                              <Progress value={compressionProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                Lütfen bekleyin, video işleniyor
                              </p>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {isUploading && (
                            <div className="space-y-3">
                              {/* Total Progress */}
                              <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                    Dosya {currentFileIndex}/{totalFiles} yükleniyor
                                  </Label>
                                  <span className="text-sm font-semibold text-green-600">{totalUploadProgress}%</span>
                                </div>
                                <Progress value={totalUploadProgress} className="h-2" />
                              </div>
                              
                              {/* Individual File Progress */}
                              <div className="px-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span className="truncate max-w-[70%]">{currentUploadFile}</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-1" />
                              </div>
                            </div>
                          )}

                          {/* Video Quality Selector */}
                          {!isCompressing && (
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
                          )}
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
                                    poster={mediaPreviews[0].thumbnail}
                                    controls
                                    className="w-full max-h-96"
                                  />
                                )}
                                
                                {/* Duration Badge (for videos) */}
                                {mediaPreviews[0].type === "video" && mediaPreviews[0].duration && (
                                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(mediaPreviews[0].duration)}
                                  </div>
                                )}
                                
                                {/* Edit Thumbnail Button (for videos) */}
                                {mediaPreviews[0].type === "video" && (
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-2 left-2 rounded-full"
                                    onClick={() => handleOpenThumbnailPicker(0)}
                                    title="Küçük resmi düzenle"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                  </Button>
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
                                            poster={media.thumbnail}
                                            controls
                                            className="w-full max-h-96"
                                          />
                                        )}
                                        
                                        {/* Duration Badge (for videos) */}
                                        {media.type === "video" && media.duration && (
                                          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(media.duration)}
                                          </div>
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
                              <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2">
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
                                          {media.thumbnail ? (
                                            <img
                                              src={media.thumbnail}
                                              alt={`Video thumbnail ${index + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <video
                                              src={media.url}
                                              className="w-full h-full object-cover"
                                            />
                                          )}
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Video className="w-6 h-6 text-white" />
                                          </div>
                                          {/* Duration Badge */}
                                          {media.duration && (
                                            <div className="absolute bottom-1 right-1 bg-black/90 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                              <Clock className="w-2.5 h-2.5" />
                                              {formatDuration(media.duration)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Controls Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                      {/* Edit Thumbnail (Videos Only) */}
                                      {media.type === "video" && (
                                        <Button
                                          size="icon"
                                          variant="secondary"
                                          className="h-7 w-7 rounded-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenThumbnailPicker(index);
                                          }}
                                          title="Küçük resmi düzenle"
                                        >
                                          <ImageIcon className="w-3 h-3" />
                                        </Button>
                                      )}
                                      
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

                      {/* Scheduled Post UI */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Gönderi Zamanla
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (scheduledAt) {
                                setScheduledAt(null);
                              } else {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(12, 0, 0, 0);
                                setScheduledAt(tomorrow);
                              }
                            }}
                          >
                            {scheduledAt ? "İptal Et" : "Zamanla"}
                          </Button>
                        </div>
                        
                        <AnimatePresence>
                          {scheduledAt && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2"
                            >
                              <div className="grid gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {scheduledAt 
                                        ? new Date(scheduledAt).toLocaleDateString("tr-TR", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          })
                                        : "Tarih seç"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-3">
                                      <input
                                        type="date"
                                        className="w-full p-2 border rounded"
                                        value={scheduledAt ? scheduledAt.toISOString().split('T')[0] : ''}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                          const newDate = new Date(e.target.value);
                                          if (scheduledAt) {
                                            newDate.setHours(scheduledAt.getHours());
                                            newDate.setMinutes(scheduledAt.getMinutes());
                                          } else {
                                            newDate.setHours(12, 0);
                                          }
                                          setScheduledAt(newDate);
                                        }}
                                      />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <input
                                    type="time"
                                    className="flex-1 p-2 border rounded text-sm"
                                    value={scheduledAt 
                                      ? `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`
                                      : "12:00"}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = scheduledAt ? new Date(scheduledAt) : new Date();
                                      newDate.setHours(parseInt(hours));
                                      newDate.setMinutes(parseInt(minutes));
                                      setScheduledAt(newDate);
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Picker Dialog */}
      <Dialog open={showThumbnailPicker} onOpenChange={setShowThumbnailPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Video Küçük Resmi Seç
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            {thumbnailPickerIndex !== null && mediaPreviews[thumbnailPickerIndex] && (
              <div className="space-y-4">
                {/* Current Preview */}
                <div className="relative rounded-lg overflow-hidden bg-black">
                  {customThumbnailPreview ? (
                    <img
                      src={customThumbnailPreview}
                      alt="Custom thumbnail preview"
                      className="w-full max-h-64 object-contain"
                    />
                  ) : (
                    <video
                      ref={thumbnailVideoRef}
                      src={livePreviewUrl}
                      className="w-full max-h-64 object-contain"
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        video.currentTime = thumbnailTime;
                      }}
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    {customThumbnailPreview ? (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        Özel Küçük Resim
                      </>
                    ) : (
                      <>
                        <Video className="w-3 h-3" />
                        Canlı Önizleme
                      </>
                    )}
                  </div>
                </div>

                {/* Option 1: Select from Video */}
                {!customThumbnailPreview && (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Videodan Kare Seç
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono">
                        {thumbnailTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[thumbnailTime]}
                      onValueChange={handleThumbnailTimeChange}
                      max={videoDuration}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Video üzerinde kaydırarak istediğiniz kareyi seçin
                    </p>
                  </div>
                )}

                {/* Divider with "VEYA" */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      veya
                    </span>
                  </div>
                </div>

                {/* Option 2: Upload Custom Image */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Özel Resim Yükle
                  </Label>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => customThumbnailInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {customThumbnailPreview ? "Farklı Resim Yükle" : "Galeriden Resim Seç"}
                  </Button>
                  <input
                    ref={customThumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCustomThumbnailUpload}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG veya WebP formatı • Maksimum 5MB
                  </p>
                  
                  {customThumbnailPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => {
                        setCustomThumbnailPreview("");
                        setCustomThumbnailFile(null);
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Özel Resmi Kaldır
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveCustomThumbnail}
                    className="flex-1 gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Kaydet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowThumbnailPicker(false);
                      setThumbnailPickerIndex(null);
                      setCustomThumbnailPreview("");
                      setCustomThumbnailFile(null);
                      if (livePreviewUrl) {
                        URL.revokeObjectURL(livePreviewUrl);
                        setLivePreviewUrl("");
                      }
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
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
      
      {/* GIF Picker */}
      <GifPicker
        open={showGifPicker}
        onOpenChange={setShowGifPicker}
        onSelectGif={(url) => {
          setGifUrl(url);
          setMediaPreviews([{ url, type: "gif" }]);
          setStep("share");
          setShowGifPicker(false);
          toast({
            title: "GIF Eklendi",
            description: "GIF gönderinize eklendi",
          });
        }}
      />
    </>
  );
};