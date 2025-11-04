import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";

interface GroupAnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    created_by: string;
  };
  currentUserId: string;
  isAdmin: boolean;
  onDelete?: () => void;
}

export const GroupAnnouncementCard = ({
  announcement,
  currentUserId,
  isAdmin,
  onDelete,
}: GroupAnnouncementCardProps) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Duyuruyu silmek istediğinizden emin misiniz?")) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("group_announcements")
        .delete()
        .eq("id", announcement.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Duyuru silindi",
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Duyuru silinemedi",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-full bg-primary/10">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                Duyuru
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(announcement.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>
            <h3 className="font-semibold text-base mb-1">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-destructive" />
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
