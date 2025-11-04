import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverId: string;
  receiverName: string;
}

export const ScheduleMessageDialog = ({
  open,
  onOpenChange,
  receiverId,
  receiverName,
}: ScheduleMessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!message.trim() || !selectedDate) {
      toast({
        title: "Hata",
        description: "Lütfen mesaj ve tarih seçin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Combine date and time
      const [hours, minutes] = selectedTime.split(":");
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Check if date is in the future
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "Hata",
          description: "Lütfen gelecekte bir tarih seçin",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("scheduled_messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: message,
        scheduled_for: scheduledDateTime.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Mesaj Zamanlandı",
        description: `Mesaj ${scheduledDateTime.toLocaleString("tr-TR")} tarihinde gönderilecek`,
      });

      setMessage("");
      setSelectedDate(new Date());
      setSelectedTime("12:00");
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling message:", error);
      toast({
        title: "Hata",
        description: "Mesaj zamanlanamadı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Mesaj Zamanla
          </DialogTitle>
          <DialogDescription>
            {receiverName} kişisine zamanlanmış mesaj gönderin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj</Label>
            <Textarea
              id="message"
              placeholder="Mesajınızı yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tarih</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Saat</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? "Zamanlanıyor..." : "Zamanla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};