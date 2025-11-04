import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquareReply, Clock, Calendar } from "lucide-react";

const DAYS = [
  { id: "monday", label: "Pazartesi" },
  { id: "tuesday", label: "Salı" },
  { id: "wednesday", label: "Çarşamba" },
  { id: "thursday", label: "Perşembe" },
  { id: "friday", label: "Cuma" },
  { id: "saturday", label: "Cumartesi" },
  { id: "sunday", label: "Pazar" },
];

export const AutoResponseSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAutoResponse();
  }, []);

  const loadAutoResponse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("auto_responses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setEnabled(data.enabled);
        setMessage(data.message);
        setStartTime(data.start_time || "09:00");
        setEndTime(data.end_time || "17:00");
        setSelectedDays(data.days_of_week || []);
      }
    } catch (error) {
      console.error("Error loading auto response:", error);
    }
  };

  const handleSave = async () => {
    if (!message.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir yanıt mesajı girin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("auto_responses")
        .upsert({
          user_id: user.id,
          enabled,
          message,
          start_time: startTime,
          end_time: endTime,
          days_of_week: selectedDays.length > 0 ? selectedDays : DAYS.map(d => d.id),
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Otomatik yanıt ayarları kaydedildi",
      });
    } catch (error) {
      console.error("Error saving auto response:", error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareReply className="w-5 h-5" />
          Otomatik Yanıtlar
        </CardTitle>
        <CardDescription>
          Meşgul olduğunuzda gelen mesajlara otomatik yanıt gönderin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Otomatik Yanıtları Etkinleştir</Label>
            <p className="text-sm text-muted-foreground">
              Gelen mesajlara otomatik yanıt gönder
            </p>
          </div>
          <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="message">Yanıt Mesajı</Label>
              <Textarea
                id="message"
                placeholder="Örn: Şu anda meşgulüm, en kısa sürede dönüş yapacağım."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Başlangıç Saati
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Bitiş Saati
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Aktif Günler
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={selectedDays.includes(day.id)}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <label
                      htmlFor={day.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
};