import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateGroupAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onAnnouncementCreated: () => void;
}

export const CreateGroupAnnouncementDialog = ({
  open,
  onOpenChange,
  groupId,
  onAnnouncementCreated,
}: CreateGroupAnnouncementDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir başlık girin",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen duyuru içeriği girin",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { error } = await supabase.from("group_announcements").insert({
        group_id: groupId,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Duyuru oluşturuldu",
      });

      // Reset form
      setTitle("");
      setContent("");
      onOpenChange(false);
      onAnnouncementCreated();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Duyuru oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duyuru Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Duyuru başlığı..."
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">İçerik</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Duyuru içeriği..."
              rows={5}
              maxLength={1000}
            />
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              "Duyuruyu Yayınla"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
