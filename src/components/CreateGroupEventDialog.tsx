import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateGroupEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onEventCreated: () => void;
}

export const CreateGroupEventDialog = ({
  open,
  onOpenChange,
  groupId,
  onEventCreated,
}: CreateGroupEventDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen etkinlik başlığı girin",
        variant: "destructive",
      });
      return;
    }

    if (!eventDate) {
      toast({
        title: "Hata",
        description: "Lütfen etkinlik tarihi seçin",
        variant: "destructive",
      });
      return;
    }

    if (!eventTime) {
      toast({
        title: "Hata",
        description: "Lütfen etkinlik saati seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Combine date and time
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);

      const { error } = await supabase.from("group_events").insert({
        group_id: groupId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDateTime.toISOString(),
        location: location.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Etkinlik oluşturuldu",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setLocation("");
      onOpenChange(false);
      onEventCreated();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Etkinlik oluşturulamadı",
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
          <DialogTitle>Etkinlik Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Etkinlik başlığı..."
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Etkinlik açıklaması..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Time */}
          <div>
            <Label htmlFor="time">Saat *</Label>
            <Input
              id="time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Etkinlik konumu..."
              maxLength={200}
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
              "Etkinliği Oluştur"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
