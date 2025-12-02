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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_try: number;
  is_active: boolean;
  created_at: string;
}

export const CreditPackageManager = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    credits: "",
    price_try: "",
    is_active: true,
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .order("credits", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Kredi paketleri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        credits: pkg.credits.toString(),
        price_try: pkg.price_try.toString(),
        is_active: pkg.is_active,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: "",
        description: "",
        credits: "",
        price_try: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.credits || !formData.price_try) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const packageData = {
        name: formData.name,
        description: formData.description || null,
        credits: parseInt(formData.credits),
        price_try: parseFloat(formData.price_try),
        is_active: formData.is_active,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("credit_packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Paket güncellendi" });
      } else {
        const { error } = await supabase
          .from("credit_packages")
          .insert(packageData);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Yeni paket eklendi" });
      }

      setIsDialogOpen(false);
      loadPackages();
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
    if (!confirm("Bu paketi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("credit_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Başarılı", description: "Paket silindi" });
      loadPackages();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Paket silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (pkg: CreditPackage) => {
    try {
      const { error } = await supabase
        .from("credit_packages")
        .update({ is_active: !pkg.is_active })
        .eq("id", pkg.id);

      if (error) throw error;
      loadPackages();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Durum güncellenemedi",
        variant: "destructive",
      });
    }
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
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Kredi Paketleri</h2>
            <p className="text-sm text-muted-foreground">
              Satılabilir kredi paketlerini yönetin
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Paket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`p-4 ${!pkg.is_active ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pkg.description}
                  </p>
                )}
              </div>
              <Badge variant={pkg.is_active ? "default" : "secondary"}>
                {pkg.is_active ? "Aktif" : "Pasif"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="font-bold text-lg">{pkg.credits}</span>
                <span className="text-sm text-muted-foreground">kredi</span>
              </div>
              <div className="text-lg font-semibold text-green-600">
                ₺{pkg.price_try}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <Switch
                checked={pkg.is_active}
                onCheckedChange={() => handleToggleActive(pkg)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(pkg)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {packages.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz kredi paketi bulunmuyor</p>
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              İlk Paketi Oluştur
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Paketi Düzenle" : "Yeni Kredi Paketi"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Paket Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Başlangıç Paketi"
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Paket açıklaması..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credits">Kredi Miktarı *</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="100"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="price">Fiyat (₺) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_try}
                  onChange={(e) => setFormData({ ...formData, price_try: e.target.value })}
                  placeholder="29.99"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
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
