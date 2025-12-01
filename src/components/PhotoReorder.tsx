import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Loader2, ChevronUp, ChevronDown } from "lucide-react";

interface UserPhoto {
  id: string;
  photo_url: string;
  display_order: number;
}

interface PhotoReorderProps {
  photos: UserPhoto[];
  onReorder: () => void;
}

export const PhotoReorder = ({ photos: initialPhotos, onReorder }: PhotoReorderProps) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    
    // Update display_order
    const updatedPhotos = newPhotos.map((photo, idx) => ({
      ...photo,
      display_order: idx,
    }));

    setPhotos(updatedPhotos);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update all photos with new display_order
      const updates = photos.map((photo, index) =>
        supabase
          .from("user_photos")
          .update({ display_order: index })
          .eq("id", photo.id)
      );

      await Promise.all(updates);

      toast({
        title: "Başarılı",
        description: "Fotoğraf sıralaması güncellendi",
      });

      onReorder();
    } catch (error: any) {
      console.error("Error updating photo order:", error);
      toast({
        title: "Hata",
        description: "Sıralama güncellenemedi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fotoğraf Sıralaması</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fotoğrafları yukarı/aşağı taşıyarak sıralayın
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
              <img
                src={photo.photo_url}
                alt={`Photo ${index + 1}`}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">Fotoğraf {index + 1}</p>
                <p className="text-sm text-muted-foreground">
                  {index === 0 ? "Profil fotoğrafı" : `${index}. sırada`}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => movePhoto(index, 'up')}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, 'down')}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Sıralamayı Kaydet"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
