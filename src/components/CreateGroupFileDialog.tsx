import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onFileUploaded: () => void;
}

export const CreateGroupFileDialog = ({
  open,
  onOpenChange,
  groupId,
  onFileUploaded,
}: CreateGroupFileDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Dosya çok büyük",
          description: "Maksimum dosya boyutu 50MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-media')
        .getPublicUrl(uploadData.path);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('group_files')
        .insert({
          group_id: groupId,
          uploaded_by: user.id,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Dosya yüklendi",
        description: "Dosya başarıyla paylaşıldı",
      });

      setSelectedFile(null);
      onFileUploaded();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dosya Paylaş</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {!selectedFile ? (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="*/*"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Dosya seçmek için tıklayın
                </p>
                <p className="text-xs text-muted-foreground">
                  Maksimum dosya boyutu: 50MB
                </p>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Yükleniyor..." : "Dosyayı Paylaş"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
