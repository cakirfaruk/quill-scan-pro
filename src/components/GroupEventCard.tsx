import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Check, X, HelpCircle, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface GroupEventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    location: string | null;
    created_by: string;
  };
  currentUserId: string;
  onDelete?: () => void;
}

export const GroupEventCard = ({ event, currentUserId, onDelete }: GroupEventCardProps) => {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<any[]>([]);
  const [userResponse, setUserResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, [event.id]);

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("user_id, status")
        .eq("event_id", event.id);

      if (error) throw error;

      setParticipants(data || []);

      // Check user's response
      const myResponse = data?.find((p) => p.user_id === currentUserId);
      setUserResponse(myResponse?.status || null);
    } catch (error: any) {
      console.error("Error loading participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status: "going" | "maybe" | "not_going") => {
    try {
      setResponding(true);

      if (userResponse) {
        // Update existing response
        const { error } = await supabase
          .from("event_participants")
          .update({ status })
          .eq("event_id", event.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from("event_participants")
          .insert({
            event_id: event.id,
            user_id: currentUserId,
            status,
          });

        if (error) throw error;
      }

      toast({
        title: "Başarılı",
        description: "Yanıtınız kaydedildi",
      });

      await loadParticipants();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Yanıt kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Etkinliği silmek istediğinizden emin misiniz?")) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("group_events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Etkinlik silindi",
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Etkinlik silinemedi",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const goingCount = participants.filter((p) => p.status === "going").length;
  const maybeCount = participants.filter((p) => p.status === "maybe").length;
  const notGoingCount = participants.filter((p) => p.status === "not_going").length;

  const isPast = new Date(event.event_date) < new Date();

  return (
    <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <Badge variant="secondary" className="text-xs">
            Etkinlik
          </Badge>
          {isPast && (
            <Badge variant="outline" className="text-xs">
              Geçmiş
            </Badge>
          )}
        </div>
        {event.created_by === currentUserId && (
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

      <h3 className="font-semibold text-lg mb-2">{event.title}</h3>

      {event.description && (
        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
          {event.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>
            {format(new Date(event.event_date), "d MMMM yyyy, HH:mm", { locale: tr })}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3 text-green-600" />
            <span>{goingCount} katılacak</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-yellow-600" />
            <span>{maybeCount} belki</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="w-3 h-3 text-red-600" />
            <span>{notGoingCount} katılmayacak</span>
          </div>
        </div>
      </div>

      {!isPast && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={userResponse === "going" ? "default" : "outline"}
            onClick={() => handleResponse("going")}
            disabled={responding}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Katılacağım
          </Button>
          <Button
            size="sm"
            variant={userResponse === "maybe" ? "default" : "outline"}
            onClick={() => handleResponse("maybe")}
            disabled={responding}
            className="flex-1"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Belki
          </Button>
          <Button
            size="sm"
            variant={userResponse === "not_going" ? "default" : "outline"}
            onClick={() => handleResponse("not_going")}
            disabled={responding}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            Katılmam
          </Button>
        </div>
      )}
    </Card>
  );
};
