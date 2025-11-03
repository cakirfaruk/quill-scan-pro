import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Users, UserPlus, Calendar, Clock, MapPin } from "lucide-react";

interface PersonData {
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
}

interface Friend {
  id: string;
  full_name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  gender: string;
}

interface PersonSelectorProps {
  label?: string;
  personData: PersonData;
  onChange: (data: PersonData) => void;
  requiredFields?: {
    fullName?: boolean;
    birthDate?: boolean;
    birthTime?: boolean;
    birthPlace?: boolean;
    gender?: boolean;
  };
}

export const PersonSelector = ({ 
  label = "Kişi Seçin", 
  personData, 
  onChange,
  requiredFields = {
    fullName: true,
    birthDate: true,
    birthTime: false,
    birthPlace: false,
    gender: false,
  }
}: PersonSelectorProps) => {
  const [selectionType, setSelectionType] = useState<"myself" | "friend" | "other">("myself");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadFriends();
  }, []);

  useEffect(() => {
    if (selectionType === "myself" && currentUser) {
      const profileData = {
        fullName: currentUser.full_name || "",
        birthDate: currentUser.birth_date || "",
        birthTime: currentUser.birth_time || "",
        birthPlace: currentUser.birth_place || "",
        gender: currentUser.gender || "",
      };
      
      // Check for missing required fields when "myself" is selected
      const missingFields: string[] = [];
      if (requiredFields.fullName && !profileData.fullName) missingFields.push("Ad Soyad");
      if (requiredFields.birthDate && !profileData.birthDate) missingFields.push("Doğum Tarihi");
      if (requiredFields.birthTime && !profileData.birthTime) missingFields.push("Doğum Saati");
      if (requiredFields.birthPlace && !profileData.birthPlace) missingFields.push("Doğum Yeri");
      if (requiredFields.gender && !profileData.gender) missingFields.push("Cinsiyet");
      
      onChange(profileData);
      
      // Store validation state for parent component
      if (missingFields.length > 0) {
        (onChange as any).missingFields = missingFields;
      } else {
        (onChange as any).missingFields = [];
      }
    } else if (selectionType === "friend" && selectedFriendId) {
      const friend = friends.find(f => f.id === selectedFriendId);
      if (friend) {
        onChange({
          fullName: friend.full_name || "",
          birthDate: friend.birth_date || "",
          birthTime: friend.birth_time || "",
          birthPlace: friend.birth_place || "",
          gender: friend.gender || "",
        });
      }
    } else if (selectionType === "other") {
      onChange({
        fullName: "",
        birthDate: "",
        birthTime: "",
        birthPlace: "",
        gender: "",
      });
    }
  }, [selectionType, selectedFriendId, currentUser, friends]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, birth_date, birth_time, birth_place, gender, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setCurrentUser({
          id: profile.user_id,
          full_name: profile.full_name,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          birth_place: profile.birth_place,
          gender: profile.gender,
        });
      }
    }
  };

  const loadFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: friendships } = await supabase
      .from("friends")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendships) {
      const friendIds = friendships.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, birth_date, birth_time, birth_place, gender")
          .in("user_id", friendIds);

        if (profiles) {
          setFriends(profiles.map(p => ({
            id: p.user_id,
            full_name: p.full_name || "İsimsiz",
            birth_date: p.birth_date || "",
            birth_time: p.birth_time || "",
            birth_place: p.birth_place || "",
            gender: p.gender || "",
          })));
        }
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label className="text-lg font-semibold mb-3 block">{label}</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectionType("myself")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                selectionType === "myself"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-medium">Kendim</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectionType("friend")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                selectionType === "friend"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Arkadaşım</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectionType("other")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                selectionType === "other"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <UserPlus className="w-6 h-6" />
              <span className="text-sm font-medium">Diğer Kişi</span>
            </button>
          </div>
        </div>

        {selectionType === "friend" && (
          <div>
            <Label htmlFor="friend-select">Arkadaş Seçin</Label>
            <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
              <SelectTrigger>
                <SelectValue placeholder="Bir arkadaş seçin" />
              </SelectTrigger>
              <SelectContent>
                {friends.map((friend) => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectionType === "other" && (
          <div className="space-y-4 mt-4">
            {requiredFields.fullName && (
              <div>
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input
                  id="fullName"
                  value={personData.fullName || ""}
                  onChange={(e) => onChange({ ...personData, fullName: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
            )}

            {requiredFields.birthDate && (
              <div>
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Doğum Tarihi *
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={personData.birthDate || ""}
                  onChange={(e) => onChange({ ...personData, birthDate: e.target.value })}
                />
              </div>
            )}

            {requiredFields.birthTime && (
              <div>
                <Label htmlFor="birthTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Doğum Saati *
                </Label>
                <Input
                  id="birthTime"
                  type="time"
                  value={personData.birthTime || ""}
                  onChange={(e) => onChange({ ...personData, birthTime: e.target.value })}
                />
              </div>
            )}

            {requiredFields.birthPlace && (
              <div>
                <Label htmlFor="birthPlace" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Doğum Yeri *
                </Label>
                <Input
                  id="birthPlace"
                  value={personData.birthPlace || ""}
                  onChange={(e) => onChange({ ...personData, birthPlace: e.target.value })}
                  placeholder="Örn: İstanbul, Türkiye"
                />
              </div>
            )}

            {requiredFields.gender && (
              <div>
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select
                  value={personData.gender || ""}
                  onValueChange={(value) => onChange({ ...personData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyet seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {selectionType !== "other" && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Seçili Kişi Bilgileri:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              {personData.fullName && <p>Ad: {personData.fullName}</p>}
              {personData.birthDate && <p>Doğum Tarihi: {new Date(personData.birthDate).toLocaleDateString("tr-TR")}</p>}
              {personData.birthTime && <p>Doğum Saati: {personData.birthTime}</p>}
              {personData.birthPlace && <p>Doğum Yeri: {personData.birthPlace}</p>}
              
              {selectionType === "myself" && (
                <>
                  {(!personData.fullName || !personData.birthDate || 
                    (requiredFields.birthTime && !personData.birthTime) || 
                    (requiredFields.birthPlace && !personData.birthPlace)) && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">⚠️ Eksik Profil Bilgileri</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Analiz yapabilmek için lütfen profil bilgilerinizi eksiksiz doldurun.
                      </p>
                      <a 
                        href="/settings" 
                        className="text-xs text-primary hover:underline inline-block mt-2"
                      >
                        Ayarlar → Profil Düzenle
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
