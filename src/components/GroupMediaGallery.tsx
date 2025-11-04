import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Video } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface GroupMediaGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

interface MediaItem {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  sender_id: string;
  sender: {
    username: string;
    profile_photo: string | null;
  };
}

export const GroupMediaGallery = ({ open, onOpenChange, groupId }: GroupMediaGalleryProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open, groupId]);

  const loadMedia = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("group_messages")
        .select("id, media_url, media_type, created_at, sender_id")
        .eq("group_id", groupId)
        .not("media_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, profile_photo")
        .in("user_id", senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const mediaWithProfiles = data.map((item) => ({
        ...item,
        sender: profileMap.get(item.sender_id) || {
          username: "Bilinmeyen",
          profile_photo: null,
        },
      }));

      // Separate photos and videos
      setPhotos(mediaWithProfiles.filter((m) => m.media_type?.startsWith("image")));
      setVideos(mediaWithProfiles.filter((m) => m.media_type?.startsWith("video")));
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Medya yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const MediaGrid = ({ items }: { items: MediaItem[] }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p>Henüz medya yok</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedMedia(item)}
          >
            <AspectRatio ratio={1}>
              {item.media_type?.startsWith("image") ? (
                <img
                  src={item.media_url}
                  alt="Grup medyası"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </AspectRatio>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Medya Galerisi</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photos">
                  Fotoğraflar ({photos.length})
                </TabsTrigger>
                <TabsTrigger value="videos">
                  Videolar ({videos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos">
                <ScrollArea className="h-[50vh] pr-4">
                  <MediaGrid items={photos} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="videos">
                <ScrollArea className="h-[50vh] pr-4">
                  <MediaGrid items={videos} />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Media Viewer Dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedMedia.sender.username} tarafından paylaşıldı
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden">
              {selectedMedia.media_type?.startsWith("image") ? (
                <img
                  src={selectedMedia.media_url}
                  alt="Medya"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.media_url}
                  controls
                  className="max-w-full max-h-[70vh]"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
