import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Pencil, Trash2, Loader2, Star, Coins, Zap } from "lucide-react";

interface DailyMission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  action_type: string;
  target_count: number;
  xp_reward: number;
  credit_reward: number;
  icon: string;
  is_active: boolean;
  is_premium_only: boolean;
  sort_order: number;
  created_at: string;
}

const CATEGORIES = [
  { value: "social", label: "Sosyal" },
  { value: "analysis", label: "Analiz" },
  { value: "engagement", label: "Etkileşim" },
  { value: "content", label: "İçerik" },
  { value: "daily", label: "Günlük" },
];

const ACTION_TYPES = [
  { value: "send_message", label: "Mesaj Gönder" },
  { value: "create_post", label: "Gönderi Oluştur" },
  { value: "like_post", label: "Gönderi Beğen" },
  { value: "comment_post", label: "Yorum Yap" },
  { value: "add_friend", label: "Arkadaş Ekle" },
  { value: "complete_analysis", label: "Analiz Tamamla" },
  { value: "watch_story", label: "Hikaye İzle" },
  { value: "share_content", label: "İçerik Paylaş" },
  { value: "daily_login", label: "Günlük Giriş" },
  { value: "profile_update", label: "Profil Güncelle" },
];

const ICONS = ["🎯", "💬", "📝", "❤️", "👥", "🔮", "📖", "🌟", "🎁", "🏆", "💎", "🔥"];

export const DailyMissionManager = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<DailyMission | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "daily",
    action_type: "daily_login",
    target_count: "1",
    xp_reward: "10",
    credit_reward: "5",
    icon: "🎯",
    is_active: true,
    is_premium_only: false,
    sort_order: "0",
  });

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_missions")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Görevler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (mission?: DailyMission) => {
    if (mission) {
      setEditingMission(mission);
      setFormData({
        title: mission.title,
        description: mission.description || "",
        category: mission.category,
        action_type: mission.action_type,
        target_count: mission.target_count.toString(),
        xp_reward: mission.xp_reward.toString(),
        credit_reward: mission.credit_reward.toString(),
        icon: mission.icon,
        is_active: mission.is_active,
        is_premium_only: mission.is_premium_only,
        sort_order: mission.sort_order.toString(),
      });
    } else {
      setEditingMission(null);
      setFormData({
        title: "",
        description: "",
        category: "daily",
        action_type: "daily_login",
        target_count: "1",
        xp_reward: "10",
        credit_reward: "5",
        icon: "🎯",
        is_active: true,
        is_premium_only: false,
        sort_order: (missions.length * 10).toString(),
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category || !formData.action_type) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const missionData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        action_type: formData.action_type,
        target_count: parseInt(formData.target_count) || 1,
        xp_reward: parseInt(formData.xp_reward) || 10,
        credit_reward: parseInt(formData.credit_reward) || 5,
        icon: formData.icon,
        is_active: formData.is_active,
        is_premium_only: formData.is_premium_only,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (editingMission) {
        const { error } = await supabase
          .from("daily_missions")
          .update(missionData)
          .eq("id", editingMission.id);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Görev güncellendi" });
      } else {
        const { error } = await supabase
          .from("daily_missions")
          .insert(missionData);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Yeni görev eklendi" });
      }

      setIsDialogOpen(false);
      loadMissions();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("daily_missions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Başarılı", description: "Görev silindi" });
      loadMissions();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Görev silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (mission: DailyMission) => {
    try {
      const { error } = await supabase
        .from("daily_missions")
        .update({ is_active: !mission.is_active })
        .eq("id", mission.id);

      if (error) throw error;
      loadMissions();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Durum güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Günlük Görevler</h2>
            <p className="text-sm text-muted-foreground">
              Kullanıcı görevlerini ve ödüllerini yönetin
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Görev
        </Button>
      </div>

      <div className="grid gap-4">
        {missions.map((mission) => (
          <Card
            key={mission.id}
            className={`p-4 ${!mission.is_active ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{mission.icon}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{mission.title}</h3>
                  {mission.is_premium_only && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3" />
                      Premium
                    </Badge>
                  )}
                  <Badge variant="outline">{getCategoryLabel(mission.category)}</Badge>
                  <Badge variant={mission.is_active ? "default" : "secondary"}>
                    {mission.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                {mission.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {mission.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    {mission.target_count}x
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Zap className="w-4 h-4" />
                    {mission.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <Coins className="w-4 h-4" />
                    {mission.credit_reward} Kredi
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={mission.is_active}
                  onCheckedChange={() => handleToggleActive(mission)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(mission)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(mission.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {missions.length === 0 && (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz günlük görev bulunmuyor</p>
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              İlk Görevi Oluştur
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMission ? "Görevi Düzenle" : "Yeni Günlük Görev"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Görev Başlığı *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Günlük Giriş Yap"
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Görev açıklaması..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Aksiyon Tipi *</Label>
                <Select
                  value={formData.action_type}
                  onValueChange={(value) => setFormData({ ...formData, action_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="target_count">Hedef Sayı</Label>
                <Input
                  id="target_count"
                  type="number"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: e.target.value })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="xp_reward">XP Ödülü</Label>
                <Input
                  id="xp_reward"
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: e.target.value })}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="credit_reward">Kredi Ödülü</Label>
                <Input
                  id="credit_reward"
                  type="number"
                  value={formData.credit_reward}
                  onChange={(e) => setFormData({ ...formData, credit_reward: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label>İkon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ICONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={formData.icon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, icon })}
                    className="text-xl w-10 h-10 p-0"
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="sort_order">Sıralama</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                min="0"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_premium_only"
                  checked={formData.is_premium_only}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium_only: checked })}
                />
                <Label htmlFor="is_premium_only">Sadece Premium</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
