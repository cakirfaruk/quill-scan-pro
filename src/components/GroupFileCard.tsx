import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GroupFileCardProps {
  file: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
    uploaded_by: string;
    uploader?: {
      username: string;
      avatar_url?: string;
    };
  };
  currentUserId: string;
  isAdmin: boolean;
  onDelete: () => void;
}

export const GroupFileCard = ({ file, currentUserId, isAdmin, onDelete }: GroupFileCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const canDelete = file.uploaded_by === currentUserId || isAdmin;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (file.file_type.includes('pdf')) return '📄';
    if (file.file_type.includes('image')) return '🖼️';
    if (file.file_type.includes('video')) return '🎥';
    if (file.file_type.includes('audio')) return '🎵';
    if (file.file_type.includes('word') || file.file_type.includes('document')) return '📝';
    if (file.file_type.includes('excel') || file.file_type.includes('spreadsheet')) return '📊';
    if (file.file_type.includes('powerpoint') || file.file_type.includes('presentation')) return '📽️';
    if (file.file_type.includes('zip') || file.file_type.includes('rar')) return '📦';
    return '📎';
  };

  const handleDownload = () => {
    window.open(file.file_url, '_blank');
  };

  const handlePreview = () => {
    window.open(file.file_url, '_blank');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('group_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      toast({
        title: "Dosya silindi",
        description: "Dosya başarıyla silindi",
      });
      onDelete();
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-4 bg-secondary/50">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{getFileIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="font-medium text-sm truncate">{file.file_name}</p>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <p>Yükleyen: {file.uploader?.username || 'Bilinmiyor'}</p>
              <p>{formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreview}
              title="Önizle"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="İndir"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title="Sil"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dosyayı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu dosya kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
