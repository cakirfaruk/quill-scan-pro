import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil } from "lucide-react";

interface EditPostDialogProps {
  postId: string;
  currentContent: string;
  onUpdate: (newContent: string) => void;
}

export const EditPostDialog = ({ postId, currentContent, onUpdate }: EditPostDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(currentContent);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!content.trim()) {
      toast({
        title: "Hata",
        description: "Gönderi içeriği boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content })
        .eq("id", postId);

      if (error) throw error;

      onUpdate(content);
      toast({
        title: "Başarılı",
        description: "Gönderi güncellendi",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Hata",
        description: "Gönderi güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-4 h-4 mr-2" />
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gönderiyi Düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ne düşünüyorsun?"
            className="min-h-[120px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              İptal
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Güncelle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
