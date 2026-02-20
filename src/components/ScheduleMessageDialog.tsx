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
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      <DialogContent className="sm:max-w-[500px] glass-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-primary" />
            Mesaj Zamanla
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {receiverName} kişisine zamanlanmış mesaj gönderin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">Mesaj</Label>
            <Textarea
              id="message"
              placeholder="Mesajınızı yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black/90 border-white/10 text-white" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-white">Saat</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/70 hover:text-white hover:bg-white/10">
            İptal
          </Button>
          <Button onClick={handleSchedule} disabled={loading} className="bg-primary hover:bg-primary/90 text-white shadow-glow">
            {loading ? "Zamanlanıyor..." : "Zamanla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};