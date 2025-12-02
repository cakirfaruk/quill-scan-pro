import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, MapPin, Clock, User, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Friend {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface Match {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
}

interface ShareMyDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const ShareMyDateDialog = ({
  open,
  onOpenChange,
  userId,
}: ShareMyDateDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"select_match" | "select_friend" | "details" | "success">("select_match");
  const [matches, setMatches] = useState<Match[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select(`
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(user_id, username, full_name, profile_photo),
          user2:profiles!matches_user2_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const matchedUsers: Match[] = (matchesData || []).map((m: any) => {
        const matchedProfile = m.user1_id === userId ? m.user2 : m.user1;
        return {
          user_id: matchedProfile.user_id,
          username: matchedProfile.username,
          full_name: matchedProfile.full_name,
          profile_photo: matchedProfile.profile_photo,
        };
      });
      setMatches(matchedUsers);

      // Load friends
      const { data: friendsData } = await supabase
        .from("friends")
        .select(`
          friend_profile:profiles!friends_friend_id_fkey(user_id, username, full_name, profile_photo)
        `)
        .eq("user_id", userId)
        .eq("status", "accepted");

      const friendsList: Friend[] = (friendsData || []).map((f: any) => ({
        user_id: f.friend_profile.user_id,
        username: f.friend_profile.username,
        full_name: f.friend_profile.full_name,
        profile_photo: f.friend_profile.profile_photo,
      }));
      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMatch || !selectedFriend) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("date_shares").insert({
        user_id: userId,
        shared_with_user_id: selectedFriend.user_id,
        match_user_id: selectedMatch.user_id,
        meeting_location: location || null,
        meeting_time: dateTime ? new Date(dateTime).toISOString() : null,
        notes: notes || null,
      });

      if (error) throw error;

      setStep("success");
      toast({
        title: "Randevu Paylaşıldı",
        description: `${selectedFriend.full_name || selectedFriend.username} randevunuz hakkında bilgilendirildi.`,
      });
    } catch (error) {
      console.error("Error sharing date:", error);
      toast({
        title: "Hata",
        description: "Randevu paylaşılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetDialog = () => {
    setStep("select_match");
    setSelectedMatch(null);
    setSelectedFriend(null);
    setLocation("");
    setDateTime("");
    setNotes("");
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const PersonCard = ({
    person,
    selected,
    onClick,
  }: {
    person: Friend | Match;
    selected: boolean;
    onClick: () => void;
  }) => (
    <Card
      className={`p-3 cursor-pointer transition-all ${
        selected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={person.profile_photo || undefined} />
          <AvatarFallback>{person.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{person.full_name || person.username}</p>
          <p className="text-xs text-muted-foreground">@{person.username}</p>
        </div>
        {selected && (
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Randevumu Paylaş
          </DialogTitle>
          <DialogDescription>
            Güvenliğiniz için randevu bilgilerinizi bir arkadaşınızla paylaşın
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : step === "select_match" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Label>Kiminle buluşuyorsunuz?</Label>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Henüz eşleşmeniz yok
                  </p>
                ) : (
                  matches.map((match) => (
                    <PersonCard
                      key={match.user_id}
                      person={match}
                      selected={selectedMatch?.user_id === match.user_id}
                      onClick={() => setSelectedMatch(match)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            <Button
              onClick={() => setStep("select_friend")}
              disabled={!selectedMatch}
              className="w-full"
            >
              Devam
            </Button>
          </motion.div>
        ) : step === "select_friend" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Label>Kime bilgi vermek istiyorsunuz?</Label>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Henüz arkadaşınız yok
                  </p>
                ) : (
                  friends.map((friend) => (
                    <PersonCard
                      key={friend.user_id}
                      person={friend}
                      selected={selectedFriend?.user_id === friend.user_id}
                      onClick={() => setSelectedFriend(friend)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select_match")} className="flex-1">
                Geri
              </Button>
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedFriend}
                className="flex-1"
              >
                Devam
              </Button>
            </div>
          </motion.div>
        ) : step === "details" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Buluşma Yeri (Opsiyonel)
              </Label>
              <Input
                placeholder="Örn: Starbucks, Kadıköy"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tarih ve Saat (Opsiyonel)
              </Label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notlar (Opsiyonel)</Label>
              <Textarea
                placeholder="Ek bilgiler..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select_friend")} className="flex-1">
                Geri
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Paylaş
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Güvendesiniz!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedFriend?.full_name || selectedFriend?.username} randevunuz hakkında
              bilgilendirildi.
            </p>
            <Button onClick={handleClose}>Tamam</Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
